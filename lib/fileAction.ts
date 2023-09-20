/**
 * @copyright Copyright (c) 2023 John Molakvoæ <skjnldsv@protonmail.com>
 *
 * @author John Molakvoæ <skjnldsv@protonmail.com>
 *
 * @license AGPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */

import { Node } from './files/node'
import { View } from './navigation/view'
import logger from './utils/logger'

export enum DefaultType {
	DEFAULT = 'default',
	HIDDEN = 'hidden',
}

interface FileActionData {
	/** Unique ID */
	id: string
	/** Translatable string displayed in the menu */
	displayName: (files: Node[], view: View) => string
	/** Translatable title for of the action */
	title?: (files: Node[], view: View) => string
	/** Svg as inline string. <svg><path fill="..." /></svg> */
	iconSvgInline: (files: Node[], view: View) => string
	/** Condition wether this action is shown or not */
	enabled?: (files: Node[], view: View) => boolean
	/**
	 * Function executed on single file action
	 * @return true if the action was executed successfully,
	 * false otherwise and null if the action is silent/undefined.
	 * @throws Error if the action failed
	 */
	exec: (file: Node, view: View, dir: string) => Promise<boolean|null>,
	/**
	 * Function executed on multiple files action
	 * @return true if the action was executed successfully,
	 * false otherwise and null if the action is silent/undefined.
	 * @throws Error if the action failed
	 */
	execBatch?: (files: Node[], view: View, dir: string) => Promise<(boolean|null)[]>
	/** This action order in the list */
	order?: number,

	/**
	 * Make this action the default.
	 * If multiple actions are default, the first one
	 * will be used. The other ones will be put as first
	 * entries in the actions menu iff DefaultType.Hidden is not used.
	 * A DefaultType.Hidden action will never be shown
	 * in the actions menu even if another action takes
	 * its place as default.
	 */
	default?: DefaultType,
	/**
	 * If true, the renderInline function will be called
	 */
	inline?: (file: Node, view: View) => boolean,
	/**
	 * If defined, the returned html element will be
	 * appended before the actions menu.
	 */
	renderInline?: (file: Node, view: View) => Promise<HTMLElement | null>,
}

export class FileAction {

	private _action: FileActionData

	constructor(action: FileActionData) {
		this.validateAction(action)
		this._action = action
	}

	get id() {
		return this._action.id
	}

	get displayName() {
		return this._action.displayName
	}

	get title() {
		return this._action.title
	}

	get iconSvgInline() {
		return this._action.iconSvgInline
	}

	get enabled() {
		return this._action.enabled
	}

	get exec() {
		return this._action.exec
	}

	get execBatch() {
		return this._action.execBatch
	}

	get order() {
		return this._action.order
	}

	get default() {
		return this._action.default
	}

	get inline() {
		return this._action.inline
	}

	get renderInline() {
		return this._action.renderInline
	}

	private validateAction(action: FileActionData) {
		if (!action.id || typeof action.id !== 'string') {
			throw new Error('Invalid id')
		}

		if (!action.displayName || typeof action.displayName !== 'function') {
			throw new Error('Invalid displayName function')
		}

		if ('title' in action && typeof action.title !== 'function') {
			throw new Error('Invalid title function')
		}

		if (!action.iconSvgInline || typeof action.iconSvgInline !== 'function') {
			throw new Error('Invalid iconSvgInline function')
		}

		if (!action.exec || typeof action.exec !== 'function') {
			throw new Error('Invalid exec function')
		}

		// Optional properties --------------------------------------------
		if ('enabled' in action && typeof action.enabled !== 'function') {
			throw new Error('Invalid enabled function')
		}

		if ('execBatch' in action && typeof action.execBatch !== 'function') {
			throw new Error('Invalid execBatch function')
		}

		if ('order' in action && typeof action.order !== 'number') {
			throw new Error('Invalid order')
		}

		if (action.default && !Object.values(DefaultType).includes(action.default)) {
			throw new Error('Invalid default')
		}

		if ('inline' in action && typeof action.inline !== 'function') {
			throw new Error('Invalid inline function')
		}

		if ('renderInline' in action && typeof action.renderInline !== 'function') {
			throw new Error('Invalid renderInline function')
		}
	}

}

export const registerFileAction = function(action: FileAction): void {
	if (typeof window._nc_fileactions === 'undefined') {
		window._nc_fileactions = []
		logger.debug('FileActions initialized')
	}

	// Check duplicates
	if (window._nc_fileactions.find(search => search.id === action.id)) {
		logger.error(`FileAction ${action.id} already registered`, { action })
		return
	}

	window._nc_fileactions.push(action)
}

export const getFileActions = function(): FileAction[] {
	if (typeof window._nc_fileactions === 'undefined') {
		window._nc_fileactions = []
		logger.debug('FileActions initialized')
	}

	return window._nc_fileactions
}
