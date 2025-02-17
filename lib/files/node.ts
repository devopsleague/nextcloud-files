/**
 * @copyright Copyright (c) 2022 John Molakvoæ <skjnldsv@protonmail.com>
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
import { basename, extname, dirname } from 'path'
import { Permission } from '../permissions'
import { FileType } from './fileType'
import { Attribute, NodeData, isDavRessource, validateData } from './nodeData'

export enum NodeStatus {
	/** This is a new node and it doesn't exists on the filesystem yet */
	NEW = 'new',
	/** This node has failed and is unavailable  */
	FAILED = 'failed',
	/** This node is currently loading or have an operation in progress */
	LOADING = 'loading',
	/** This node is locked and cannot be modified */
	LOCKED = 'locked',
}

export abstract class Node {

	private _data: NodeData
	private _attributes: Attribute
	private _knownDavService = /(remote|public)\.php\/(web)?dav/i

	constructor(data: NodeData, davService?: RegExp) {
		// Validate data
		validateData(data, davService || this._knownDavService)

		this._data = data

		const handler = {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			set: (target: Attribute, prop: string, value: any): any => {
				// Edit modification time
				this.updateMtime()
				// Apply original changes
				return Reflect.set(target, prop, value)
			},
			deleteProperty: (target: Attribute, prop: string) => {
				// Edit modification time
				this.updateMtime()
				// Apply original changes
				return Reflect.deleteProperty(target, prop)
			},
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as ProxyHandler<any>

		// Proxy the attributes to update the mtime on change
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		this._attributes = new Proxy(data.attributes || {} as any, handler)
		delete this._data.attributes

		if (davService) {
			this._knownDavService = davService
		}
	}

	/**
	 * Get the source url to this object
	 */
	get source(): string {
		// strip any ending slash
		return this._data.source.replace(/\/$/i, '')
	}

	/**
	 * Get this object name
	 */
	get basename(): string {
		return basename(this.source)
	}

	/**
	 * Get this object's extension
	 */
	get extension(): string|null {
		return extname(this.source)
	}

	/**
	 * Get the directory path leading to this object
	 * Will use the relative path to root if available
	 */
	get dirname(): string {
		if (this.root) {
			// Using replace would remove all part matching root
			const firstMatch = this.source.indexOf(this.root)
			return dirname(this.source.slice(firstMatch + this.root.length) || '/')
		}

		// This should always be a valid URL
		// as this is tested in the constructor
		const url = new URL(this.source)
		return dirname(url.pathname)
	}

	/**
	 * Is it a file or a folder ?
	 */
	abstract get type(): FileType

	/**
	 * Get the file mime
	 */
	get mime(): string|undefined {
		return this._data.mime
	}

	/**
	 * Get the file modification time
	 */
	get mtime(): Date|undefined {
		return this._data.mtime
	}

	/**
	 * Get the file creation time
	 */
	get crtime(): Date|undefined {
		return this._data.crtime
	}

	/**
	 * Get the file size
	 */
	get size(): number|undefined {
		return this._data.size
	}

	/**
	 * Get the file attribute
	 */
	get attributes(): Attribute {
		return this._attributes
	}

	/**
	 * Get the file permissions
	 */
	get permissions(): Permission {
		// If this is not a dav ressource, we can only read it
		if (this.owner === null && !this.isDavRessource) {
			return Permission.READ
		}

		// If the permissions are not defined, we have none
		return this._data.permissions !== undefined
			? this._data.permissions
			: Permission.NONE
	}

	/**
	 * Get the file owner
	 */
	get owner(): string|null {
		// Remote ressources have no owner
		if (!this.isDavRessource) {
			return null
		}
		return this._data.owner
	}

	/**
	 * Is this a dav-related ressource ?
	 */
	get isDavRessource(): boolean {
		return isDavRessource(this.source, this._knownDavService)
	}

	/**
	 * Get the dav root of this object
	 */
	get root(): string|null {
		// If provided (recommended), use the root and strip away the ending slash
		if (this._data.root) {
			return this._data.root.replace(/^(.+)\/$/, '$1')
		}

		// Use the source to get the root from the dav service
		if (this.isDavRessource) {
			const root = dirname(this.source)
			return root.split(this._knownDavService).pop() || null
		}

		return null
	}

	/**
	 * Get the absolute path of this object relative to the root
	 */
	get path(): string {
		if (this.root) {
			// Using replace would remove all part matching root
			const firstMatch = this.source.indexOf(this.root)
			return this.source.slice(firstMatch + this.root.length) || '/'
		}
		return (this.dirname + '/' + this.basename).replace(/\/\//g, '/')
	}

	/**
	 * Get the node id if defined.
	 * Will look for the fileid in attributes if undefined.
	 */
	get fileid(): number|undefined {
		return this._data?.id || this.attributes?.fileid
	}

	/**
	 * Get the node status.
	 */
	get status(): NodeStatus|undefined {
		return this._data?.status
	}

	/**
	 * Set the node status.
	 */
	set status(status: NodeStatus|undefined) {
		this._data.status = status
	}

	/**
	 * Move the node to a new destination
	 *
	 * @param {string} destination the new source.
	 * e.g. https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg
	 */
	move(destination: string) {
		validateData({ ...this._data, source: destination }, this._knownDavService)
		this._data.source = destination
		this.updateMtime()
	}

	/**
	 * Rename the node
	 * This aliases the move method for easier usage
	 *
	 * @param basename The new name of the node
	 */
	rename(basename: string) {
		if (basename.includes('/')) {
			throw new Error('Invalid basename')
		}
		this.move(dirname(this.source) + '/' + basename)
	}

	/**
	 * Update the mtime if exists.
	 */
	private updateMtime() {
		if (this._data.mtime) {
			this._data.mtime = new Date()
		}
	}

}
