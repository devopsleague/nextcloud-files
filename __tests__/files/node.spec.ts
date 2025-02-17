import { describe, expect, test } from 'vitest'

import { File } from '../../lib/files/file'
import { Folder } from '../../lib/files/folder'
import { Attribute, NodeData } from '../../lib/files/nodeData'
import { Permission } from '../../lib/permissions'
import { NodeStatus } from '../../lib/files/node'

describe('Node testing', () => {
	test('Root null fallback', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
		})
		expect(file.root).toBeNull()
	})

	test('Remove source ending slash', () => {
		const file = new Folder({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/',
			owner: 'emma',
		})
		expect(file.source).toBe('https://cloud.domain.com/remote.php/dav/files/emma/Photos')
	})

	test('Invalid rename', () => {
		const file = new Folder({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/',
			owner: 'emma',
		})
		expect(() => file.rename('new/folder')).toThrowError('Invalid basename')
	})
})

describe('FileId attribute', () => {
	test('FileId null fallback', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
		})
		expect(file.fileid).toBeUndefined()
	})

	test('FileId null fallback', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
			id: 1234,
		})
		expect(file.fileid).toBe(1234)
	})

	// Mostly used when a node is unavailable
	test('FileId negative fallback', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
			id: -1234,
		})
		expect(file.fileid).toBe(-1234)
	})

	test('FileId attributes fallback', () => {
		const file = new Folder({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/',
			mime: 'image/jpeg',
			owner: 'emma',
			attributes: {
				fileid: 1234,
			},
		})
		expect(file.fileid).toBe(1234)
	})
})

describe('Sanity checks', () => {
	test('Invalid id', () => {
		expect(() => new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
			id: '1234' as unknown as number,
		})).toThrowError('Invalid id type of value')
	})

	test('Invalid source', () => {
		expect(() => new File({} as unknown as NodeData)).toThrowError('Missing mandatory source')
		expect(() => new File({
			source: 'cloud.domain.com/remote.php/dav/Photos',
			mime: 'image/jpeg',
			owner: 'emma',
		})).toThrowError('Invalid source')
		expect(() => new File({
			source: '/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
		})).toThrowError('Invalid source format, source must be a valid URL')
		expect(() => new File({
			source: 'ftp://remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
		})).toThrowError('Invalid source format, only http(s) is supported')
	})

	test('Invalid mtime', () => {
		expect(() => new File({
			source: 'https://cloud.domain.com/remote.php/dav/Photos',
			mime: 'image',
			owner: 'emma',
			mtime: 'invalid' as unknown as Date,
		})).toThrowError('Invalid mtime type')
	})

	test('Invalid crtime', () => {
		expect(() => new File({
			source: 'https://cloud.domain.com/remote.php/dav/Photos',
			mime: 'image',
			owner: 'emma',
			crtime: 'invalid' as unknown as Date,
		})).toThrowError('Invalid crtime type')
	})

	test('Invalid mime', () => {
		expect(() => new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image',
			owner: 'emma',
		})).toThrowError('Missing or invalid mandatory mime')
	})

	test('Invalid attributes', () => {
		expect(() => new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
			attributes: 'test' as unknown as Attribute,
		})).toThrowError('Invalid attributes type')
	})

	test('Invalid permissions', () => {
		expect(() => new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
			permissions: 324 as unknown as number,
		})).toThrowError('Invalid permissions')
	})

	test('Invalid size', () => {
		expect(() => new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
			size: 'test' as unknown as number,
		})).toThrowError('Invalid size type')
	})

	test('Invalid owner', () => {
		expect(() => new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: true as unknown as string,
		})).toThrowError('Invalid owner')
	})

	test('Invalid root', () => {
		expect(() => new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
			root: true as unknown as string,
		})).toThrowError('Invalid root type')

		expect(() => new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
			root: 'https://cloud.domain.com/remote.php/dav/',
		})).toThrowError('Root must start with a leading slash')

		expect(() => new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
			root: '/files/john',
		})).toThrowError('Root must be part of the source')

		expect(() => new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
			root: '/remote.php/dav/files/emma',
		})).toThrowError('The root must be relative to the service. e.g /files/emma')
	})

	test('Invalid status', () => {
		expect(() => new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
			status: 'invalid' as unknown as NodeStatus,
		})).toThrowError('Status must be a valid NodeStatus')
	})
})

describe('Dav service detection', () => {
	test('Known dav services', () => {
		const file1 = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
		})
		expect(file1.isDavRessource).toBe(true)

		const file2 = new File({
			source: 'https://cloud.domain.com/remote.php/webdav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
		})
		expect(file2.isDavRessource).toBe(true)

		const file3 = new File({
			source: 'https://cloud.domain.com/public.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
		})
		expect(file3.isDavRessource).toBe(true)

		const file4 = new File({
			source: 'https://cloud.domain.com/public.php/webdav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
		})
		expect(file4.isDavRessource).toBe(true)
	})

	test('Custom dav service', () => {
		const file1 = new File({
			source: 'https://cloud.domain.com/test.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
		}, /test\.php\/dav/)
		expect(file1.isDavRessource).toBe(true)

		const file2 = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
		}, /test\.php\/dav/)
		expect(file2.isDavRessource).toBe(false)
	})
})

describe('Permissions handling', () => {
	test('Default permissions', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
		})
		expect(file.permissions).toBe(0)
	})

	test('Custom permissions', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
			permissions: Permission.READ | Permission.UPDATE | Permission.CREATE | Permission.DELETE | Permission.SHARE,
		})
		expect(file.permissions).toBe(31)
	})
})

describe('Root and paths detection', () => {
	test('Unknown root', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
		})
		expect(file.root).toBe('/files/emma/Photos')
		expect(file.dirname).toBe('/')
	})

	test('Provided root dav service', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
			root: '/files/emma',
		})
		expect(file.root).toBe('/files/emma')
		expect(file.dirname).toBe('/Photos')
	})

	test('Root with ending slash is removed', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
			root: '/files/emma/',
		})
		expect(file.root).toBe('/files/emma')
		expect(file.dirname).toBe('/Photos')
		expect(file.path).toBe('/Photos/picture.jpg')
	})

	test('Root and source are the same', () => {
		const folder = new Folder({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma',
			owner: 'emma',
			root: '/files/emma',
		})
		expect(folder.root).toBe('/files/emma')
		expect(folder.dirname).toBe('/')
		expect(folder.path).toBe('/')
	})

	test('Source contains a similar root path', () => {
		const folder = new Folder({
			source: 'https://domain.com/remote.php/dav/files/emma/files/emma',
			owner: 'emma',
			root: '/files/emma',
		})
		expect(folder.root).toBe('/files/emma')
		expect(folder.dirname).toBe('/files')
		expect(folder.path).toBe('/files/emma')

		const file = new File({
			source: 'https://domain.com/remote.php/dav/files/emma/files/emma.jpeg',
			mime: 'image/jpeg',
			owner: 'emma',
			root: '/files/emma',
		})
		expect(file.root).toBe('/files/emma')
		expect(file.dirname).toBe('/files')
		expect(file.path).toBe('/files/emma.jpeg')
	})

	test('Non dav ressource with undefined root', () => {
		const file = new File({
			source: 'https://domain.com/files/images/emma.jpeg',
			mime: 'image/jpeg',
			owner: 'emma',
		})
		expect(file.isDavRessource).toBe(false)
		expect(file.root).toBe(null)
		expect(file.dirname).toBe('/files/images')
		expect(file.path).toBe('/files/images/emma.jpeg')
	})
})

describe('Undefined properties are allowed', () => {
	test('File', () => {
		expect(() => new File({
			source: 'https://domain.com/files/images/emma.jpeg',
			owner: 'emma',
			id: undefined,
			mtime: undefined,
			crtime: undefined,
			// Mime is optional for folders only
			mime: 'image/jpeg',
			size: undefined,
			permissions: undefined,
			attributes: undefined,
			root: undefined,
		})).not.toThrow()
	})

	test('Folder', () => {
		expect(() => new Folder({
			source: 'https://domain.com/files/images/',
			owner: 'emma',
			id: undefined,
			mtime: undefined,
			crtime: undefined,
			mime: undefined,
			size: undefined,
			permissions: undefined,
			attributes: undefined,
			root: undefined,
		})).not.toThrow()
	})
})
