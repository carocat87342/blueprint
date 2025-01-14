/*
 * Copyright 2016 Palantir Technologies, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview This component is DEPRECATED, and the code is frozen.
 * All changes & bugfixes should be made to ContextMenu2 instead.
 */

/* eslint-disable deprecation/deprecation */

import * as React from "react";
import * as ReactDOM from "react-dom";

import { isDarkTheme, isFunction } from "../common/utils";
import { show as showLegacyContextMenu } from "./contextMenuLegacy";
import { Constructor, getDisplayName } from "./legacyCommon";

export const CONTEXTMENU_WARN_DECORATOR_NO_METHOD = `[Blueprint] @ContextMenuTarget-decorated class should implement renderContextMenu.`;
export const CONTEXTMENU_WARN_DECORATOR_NEEDS_REACT_ELEMENT = `[Blueprint] "@ContextMenuTarget-decorated components must return a single JSX.Element or an empty render.`;

export interface ContextMenuTargetLegacyComponent extends React.Component {
    render(): React.ReactElement<any> | null | undefined;
    renderContextMenu: (e: React.MouseEvent<HTMLElement>) => JSX.Element | undefined;
    onContextMenuClose?: () => void;
}

/**
 * ContextMenuTarget decorator.
 *
 * @see https://blueprintjs.com/docs/#core/components/context-menu.decorator-usage
 * @deprecated use ContextMenu2
 */
export function ContextMenuTargetLegacy<T extends Constructor<ContextMenuTargetLegacyComponent>>(WrappedComponent: T) {
    if (!isFunction(WrappedComponent.prototype.renderContextMenu)) {
        console.warn(CONTEXTMENU_WARN_DECORATOR_NO_METHOD);
    }

    return class ContextMenuTargetClass extends WrappedComponent {
        public static displayName = `ContextMenuTarget(${getDisplayName(WrappedComponent)})`;

        public render() {
            const element = super.render();

            if (element == null) {
                // always return `element` in case caller is distinguishing between `null` and `undefined`
                return element;
            }

            if (!React.isValidElement<any>(element)) {
                console.warn(CONTEXTMENU_WARN_DECORATOR_NEEDS_REACT_ELEMENT);
                return element;
            }
            const oldOnContextMenu = element.props.onContextMenu as React.MouseEventHandler<HTMLElement>;
            const onContextMenu = (e: React.MouseEvent<HTMLElement>) => {
                // support nested menus (inner menu target would have called preventDefault())
                if (e.defaultPrevented) {
                    return;
                }

                if (isFunction(this.renderContextMenu)) {
                    const menu = this.renderContextMenu(e);
                    if (menu != null) {
                        // HACKHACK: see https://github.com/palantir/blueprint/issues/3979
                        /* eslint-disable-next-line react/no-find-dom-node */
                        const darkTheme = isDarkTheme(ReactDOM.findDOMNode(this));
                        e.preventDefault();
                        showLegacyContextMenu(
                            menu,
                            { left: e.clientX, top: e.clientY },
                            this.onContextMenuClose,
                            darkTheme,
                        );
                    }
                }

                oldOnContextMenu?.(e);
            };

            return React.cloneElement(element, { onContextMenu });
        }
    };
}
