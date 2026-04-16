'use client'

import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Folder,
    File,
    Image as ImageIcon,
    Video,
    FileText,
    FolderPlus,
    ChevronRight,
    FilePlus,
    LayoutGrid,
    List,
    Rows3,
    CalendarDays,
    HardDrive,
    MoreHorizontal,
    Pencil,
    Trash2,
    Loader2,
    Link as LinkIcon,
} from 'lucide-react'
import { Tree, TreeItem } from '@/components/ui/tree'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    addFileHandler,
    addFolderHandler,
    deleteFileHandler,
    deleteFolderHandler,
    getGalleryHandler,
    updateFileHandler,
    updateFolderHandler,
} from '@/services/galleryHandler'
import type {
    AddFilePayload,
    AddFileResponse,
    AddFolderPayload,
    AddFolderResponse,
    DeleteFilePayload,
    DeleteFileResponse,
    DeleteFolderPayload,
    DeleteFolderResponse,
    GetGalleryResponse,
    GalleryFolderItem,
    UpdateFilePayload,
    UpdateFileResponse,
    UpdateFolderPayload,
    UpdateFolderResponse,
} from '@/types/galleryTypes'

type FileType = 'image' | 'video' | 'pdf' | 'other'
type ViewMode = 'grid' | 'list' | 'detailed'

type FileNode = {
    id: string
    name: string
    type: 'folder' | 'file'
    fileType?: FileType
    url?: string
    size?: string
    createdAt?: string
    folderId?: number
    fileIndex?: number
    children?: FileNode[]
}

type AddFileMutationVariables = {
    folderId: number | string
    payload: AddFilePayload
}

type UpdateFolderMutationVariables = {
    folderId: number | string
    payload: UpdateFolderPayload
}

type UpdateFileMutationVariables = {
    folderId: number | string
    fileIndex: number | string
    payload: UpdateFilePayload
}

type DeleteFolderMutationVariables = {
    folderId: number | string
    payload?: DeleteFolderPayload
}

type DeleteFileMutationVariables = {
    folderId: number | string
    fileIndex: number | string
    payload?: DeleteFilePayload
}

const galleryQueryKey = ['gallery-data']

function mapApiFileType(type?: string): FileType {
    if (type === 'image') return 'image'
    if (type === 'video') return 'video'
    if (type === 'pdf') return 'pdf'
    return 'other'
}

function formatDate(value?: string | null): string | undefined {
    if (!value) return undefined
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

function formatSizeFromName(name?: string | null): string | undefined {
    if (!name) return undefined
    return '--'
}

function transformFoldersToTree(folders: GalleryFolderItem[]): FileNode[] {
    return folders.map((folder) => ({
        id: `folder-${folder.id}`,
        name: folder.folder_name,
        type: 'folder',
        createdAt: formatDate(folder.created_at),
        folderId: folder.id,
        children: folder.files.map((file) => ({
            id: `folder-${folder.id}-file-${file.file_index}`,
            name: file.title?.trim() || file.file_name || `File ${file.file_index + 1}`,
            type: 'file',
            fileType: mapApiFileType(file.file_type),
            url: file.file_url ?? undefined,
            size: formatSizeFromName(file.file_name),
            createdAt: formatDate(folder.updated_at || folder.created_at),
            folderId: folder.id,
            fileIndex: file.file_index,
        })),
    }))
}

function getAllFiles(nodes: FileNode[]): FileNode[] {
    let files: FileNode[] = []
    nodes.forEach((node) => {
        if (node.type === 'file') files.push(node)
        if (node.children) files = files.concat(getAllFiles(node.children))
    })
    return files
}

function getAllItems(nodes: FileNode[]): FileNode[] {
    let items: FileNode[] = []
    nodes.forEach((node) => {
        items.push(node)
        if (node.children) {
            items = items.concat(getAllItems(node.children))
        }
    })
    return items
}

function getIcon(file: FileNode) {
    if (file.type === 'folder') return <Folder className="h-4 w-4 text-yellow-500" />
    if (file.fileType === 'image') return <ImageIcon className="h-4 w-4 text-blue-500" />
    if (file.fileType === 'video') return <Video className="h-4 w-4 text-purple-500" />
    if (file.fileType === 'pdf') return <FileText className="h-4 w-4 text-red-500" />
    return <File className="h-4 w-4 text-gray-500" />
}

function findNodeById(nodes: FileNode[], id: string): FileNode | null {
    for (const node of nodes) {
        if (node.id === id) return node
        if (node.children) {
            const found = findNodeById(node.children, id)
            if (found) return found
        }
    }
    return null
}

function findPathById(nodes: FileNode[], id: string, parents: FileNode[] = []): FileNode[] {
    for (const node of nodes) {
        const currentPath = [...parents, node]
        if (node.id === id) return currentPath
        if (node.children) {
            const childPath = findPathById(node.children, id, currentPath)
            if (childPath.length) return childPath
        }
    }
    return []
}

function getPreview(file: FileNode) {
    if (file.type === 'folder') {
        return (
            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-amber-50 to-yellow-100">
                <Folder className="h-10 w-10 text-yellow-500" />
            </div>
        )
    }

    if (file.fileType === 'image' && file.url) {
        return <img src={file.url} alt={file.name} className="h-full w-full object-cover" />
    }

    if (file.fileType === 'video') {
        return (
            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-violet-50 to-purple-100">
                <Video className="h-10 w-10 text-purple-500" />
            </div>
        )
    }

    if (file.fileType === 'pdf') {
        return (
            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-red-50 to-rose-100">
                <FileText className="h-10 w-10 text-red-500" />
            </div>
        )
    }

    return (
        <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-slate-50 to-slate-100">
            <File className="h-10 w-10 text-slate-500" />
        </div>
    )
}

type ItemActionsProps = {
    item: FileNode
    onRename: (item: FileNode) => void
    onDelete: (item: FileNode) => void
}

function ItemActions({ item, onRename, onDelete }: ItemActionsProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                >
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-xl">
                <DropdownMenuItem
                    onClick={(e) => {
                        e.stopPropagation()
                        onRename(item)
                    }}
                    className="flex items-center gap-2"
                >
                    <Pencil className="h-4 w-4" />
                    <span>{item.type === 'folder' ? 'Rename folder' : 'Rename file'}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={(e) => {
                        e.stopPropagation()
                        onDelete(item)
                    }}
                    className="flex items-center gap-2 text-red-600 focus:text-red-600"
                >
                    <Trash2 className="h-4 w-4" />
                    <span>{item.type === 'folder' ? 'Delete folder' : 'Delete file'}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

type TreeNodeLabelProps = {
    item: FileNode
    isPrimary?: boolean
    onSelect: (item: FileNode) => void
    onRename: (item: FileNode) => void
    onDelete: (item: FileNode) => void
}

function TreeNodeLabel({ item, isPrimary = false, onSelect, onRename, onDelete }: TreeNodeLabelProps) {
    return (
        <div className="flex w-60 items-center justify-between gap-4 pr-1 ">
            <div
                className={`flex min-w-0 flex-1 items-center gap-3 ${isPrimary ? 'text-primary' : ''}`}
                onClick={(e) => {
                    e.stopPropagation()
                    onSelect(item)
                }}
            >
                {getIcon(item)}
                <span className="truncate text-sm">{item.name}</span>
            </div>

            <div>
                {item.type === 'folder' ? (
                    <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                        <ItemActions item={item} onRename={onRename} onDelete={onDelete} />
                    </div>
                ) : null}
            </div>
        </div>
    )
}

export default function Gallery() {
    const queryClient = useQueryClient()

    const { data, isLoading, isError, refetch } = useQuery<GetGalleryResponse>({
        queryKey: galleryQueryKey,
        queryFn: getGalleryHandler,
    })

    const addFolderMutation = useMutation<AddFolderResponse, Error, AddFolderPayload>({
        mutationFn: addFolderHandler,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: galleryQueryKey })
        },
    })

    const addFileMutation = useMutation<AddFileResponse, Error, AddFileMutationVariables>({
        mutationFn: ({ folderId, payload }) => addFileHandler(folderId, payload),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: galleryQueryKey })
        },
    })

    const updateFolderMutation = useMutation<UpdateFolderResponse, Error, UpdateFolderMutationVariables>({
        mutationFn: ({ folderId, payload }) => updateFolderHandler(folderId, payload),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: galleryQueryKey })
        },
    })

    const updateFileMutation = useMutation<UpdateFileResponse, Error, UpdateFileMutationVariables>({
        mutationFn: ({ folderId, fileIndex, payload }) => updateFileHandler(folderId, fileIndex, payload),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: galleryQueryKey })
        },
    })

    const deleteFolderMutation = useMutation<DeleteFolderResponse, Error, DeleteFolderMutationVariables>({
        mutationFn: ({ folderId, payload }) => deleteFolderHandler(folderId, payload),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: galleryQueryKey })
        },
    })

    const deleteFileMutation = useMutation<DeleteFileResponse, Error, DeleteFileMutationVariables>({
        mutationFn: ({ folderId, fileIndex, payload }) => deleteFileHandler(folderId, fileIndex, payload),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: galleryQueryKey })
        },
    })

    const folders = React.useMemo(() => {
        if (!data?.success) return []
        return data.data.folders
    }, [data])

    const treeData = React.useMemo(() => transformFoldersToTree(folders), [folders])

    const [selectedFolder, setSelectedFolder] = React.useState<string | null>(null)
    const [selectedFile, setSelectedFile] = React.useState<FileNode | null>(null)
    const [viewMode, setViewMode] = React.useState<ViewMode>('grid')
    const [renameTarget, setRenameTarget] = React.useState<FileNode | null>(null)
    const [deleteTarget, setDeleteTarget] = React.useState<FileNode | null>(null)
    const [renameValue, setRenameValue] = React.useState('')
    const [createFolderOpen, setCreateFolderOpen] = React.useState(false)
    const [addFileOpen, setAddFileOpen] = React.useState(false)
    const [newFolderName, setNewFolderName] = React.useState('')
    const [newFileTitle, setNewFileTitle] = React.useState('')
    const [newFileDescription, setNewFileDescription] = React.useState('')
    const [newFileLink, setNewFileLink] = React.useState('')
    const [newFile, setNewFile] = React.useState<File | null>(null)

    React.useEffect(() => {
        if (!selectedFolder && treeData.length > 0) {
            setSelectedFolder(treeData[0].id)
        }
    }, [treeData, selectedFolder])

    React.useEffect(() => {
        if (selectedFolder) {
            const selectedExists = findNodeById(treeData, selectedFolder)
            if (!selectedExists) {
                setSelectedFolder(treeData[0]?.id ?? null)
            }
        }
    }, [selectedFolder, treeData])

    React.useEffect(() => {
        if (selectedFile) {
            const selectedExists = findNodeById(treeData, selectedFile.id)
            if (!selectedExists) {
                setSelectedFile(null)
            }
        }
    }, [selectedFile, treeData])

    const allFiles = React.useMemo(() => getAllFiles(treeData), [treeData])
    const allItems = React.useMemo(() => getAllItems(treeData), [treeData])

    const filteredItems = React.useMemo(() => {
        if (!selectedFolder) return allItems.filter((item) => item.type === 'file')
        const folder = findNodeById(treeData, selectedFolder)
        return folder?.children ?? []
    }, [selectedFolder, allItems, treeData])

    const breadcrumbItems = React.useMemo(() => {
        if (selectedFile) {
            return findPathById(treeData, selectedFile.id)
        }
        if (selectedFolder) {
            return findPathById(treeData, selectedFolder)
        }
        return []
    }, [selectedFolder, selectedFile, treeData])

    const selectedFolderNode = React.useMemo(() => {
        if (!selectedFolder) return null
        return findNodeById(treeData, selectedFolder)
    }, [selectedFolder, treeData])

    const handleFolderSelect = (folderId: string) => {
        setSelectedFolder(folderId)
        setSelectedFile(null)
    }

    const handleItemClick = (item: FileNode) => {
        if (item.type === 'folder') {
            handleFolderSelect(item.id)
            return
        }
        setSelectedFile(item)
    }

    const handleTreeItemSelect = (item: FileNode) => {
        if (item.type === 'folder') {
            handleFolderSelect(item.id)
            return
        }
        setSelectedFile(item)
    }

    const openRenameDialog = (item: FileNode) => {
        setRenameTarget(item)
        setRenameValue(item.name)
    }

    const openDeleteDialog = (item: FileNode) => {
        setDeleteTarget(item)
    }

    const handleRenameSubmit = async () => {
        if (!renameTarget) return
        const nextName = renameValue.trim()
        if (!nextName) return

        if (renameTarget.type === 'folder' && typeof renameTarget.folderId === 'number') {
            await updateFolderMutation.mutateAsync({
                folderId: renameTarget.folderId,
                payload: {
                    folder_name: nextName,
                },
            })
        }

        if (
            renameTarget.type === 'file' &&
            typeof renameTarget.folderId === 'number' &&
            typeof renameTarget.fileIndex === 'number'
        ) {
            await updateFileMutation.mutateAsync({
                folderId: renameTarget.folderId,
                fileIndex: renameTarget.fileIndex,
                payload: {
                    title: nextName,
                },
            })
        }

        setRenameTarget(null)
        setRenameValue('')
    }

    const handleDeleteSubmit = async () => {
        if (!deleteTarget) return

        if (deleteTarget.type === 'folder' && typeof deleteTarget.folderId === 'number') {
            await deleteFolderMutation.mutateAsync({
                folderId: deleteTarget.folderId,
            })
        }

        if (
            deleteTarget.type === 'file' &&
            typeof deleteTarget.folderId === 'number' &&
            typeof deleteTarget.fileIndex === 'number'
        ) {
            await deleteFileMutation.mutateAsync({
                folderId: deleteTarget.folderId,
                fileIndex: deleteTarget.fileIndex,
            })
        }

        if (selectedFile?.id === deleteTarget.id) {
            setSelectedFile(null)
        }

        if (selectedFolder === deleteTarget.id) {
            setSelectedFolder(null)
        }

        setDeleteTarget(null)
    }

    const handleAddFolder = async () => {
        const folderName = newFolderName.trim()
        if (!folderName) return

        const response = await addFolderMutation.mutateAsync({
            folder_name: folderName,
        })

        setNewFolderName('')
        setCreateFolderOpen(false)

        if (response.success) {
            setSelectedFolder(`folder-${response.data.id}`)
        }
    }

    const handleAddFile = async () => {
        if (!selectedFolderNode || typeof selectedFolderNode.folderId !== 'number') return
        if (!newFile && !newFileLink.trim()) return

        await addFileMutation.mutateAsync({
            folderId: selectedFolderNode.folderId,
            payload: {
                title: newFileTitle.trim() || undefined,
                description: newFileDescription.trim() || undefined,
                link: newFileLink.trim() || undefined,
                file: newFile ?? undefined,
            },
        })

        setNewFileTitle('')
        setNewFileDescription('')
        setNewFileLink('')
        setNewFile(null)
        setAddFileOpen(false)
    }

    const isMutating =
        addFolderMutation.isPending ||
        addFileMutation.isPending ||
        updateFolderMutation.isPending ||
        updateFileMutation.isPending ||
        deleteFolderMutation.isPending ||
        deleteFileMutation.isPending

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-80px)] w-full items-center justify-center rounded-xl border bg-background">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading gallery...</span>
                </div>
            </div>
        )
    }

    if (isError) {
        return (
            <div className="flex h-[calc(100vh-80px)] w-full items-center justify-center rounded-xl border bg-background">
                <div className="space-y-3 text-center">
                    <div className="text-sm text-muted-foreground">Failed to load gallery data</div>
                    <Button onClick={() => refetch()} variant="outline">
                        Retry
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="flex h-[calc(100vh-80px)] w-full overflow-hidden rounded-xl border bg-background">
                <div className="w-72 border-r bg-muted/20">
                    <div className="flex justify-between border-b px-4 py-2">
                        <Label>All folders</Label>
                        <Button variant="ghost" size="sm" onClick={() => setCreateFolderOpen(true)}>
                            <FolderPlus className="text-primary" />
                        </Button>
                    </div>

                    <ScrollArea className="h-full px-2">
                        <Tree>
                            {treeData.map((node) => (
                                <TreeItem
                                    key={node.id}
                                    id={node.id}
                                    onClick={() => node.type === 'folder' && handleFolderSelect(node.id)}
                                    label={
                                        <TreeNodeLabel
                                            item={node}
                                            isPrimary
                                            onSelect={handleTreeItemSelect}
                                            onRename={openRenameDialog}
                                            onDelete={openDeleteDialog}
                                        />
                                    }
                                >
                                    {node.children?.map((child) => (
                                        <TreeItem
                                            key={child.id}
                                            id={child.id}
                                            onClick={() => child.type === 'folder' && handleFolderSelect(child.id)}
                                            label={
                                                <TreeNodeLabel
                                                    item={child}
                                                    onSelect={handleTreeItemSelect}
                                                    onRename={openRenameDialog}
                                                    onDelete={openDeleteDialog}
                                                />
                                            }
                                        />
                                    ))}
                                </TreeItem>
                            ))}
                        </Tree>
                    </ScrollArea>
                </div>

                <div className="flex flex-1 flex-col">
                    <div className="flex items-center justify-between border-b px-4 py-2">
                        <div>
                            {breadcrumbItems.length > 0 ? (
                                <div className="flex flex-wrap items-center text-sm">
                                    {breadcrumbItems.map((item, index) => {
                                        const isLast = index === breadcrumbItems.length - 1
                                        return (
                                            <React.Fragment key={item.id}>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    type="button"
                                                    onClick={() => {
                                                        if (item.type === 'folder') {
                                                            handleFolderSelect(item.id)
                                                        } else {
                                                            setSelectedFile(item)
                                                        }
                                                    }}
                                                    className={`inline-flex items-center rounded-md transition ${isLast
                                                        ? 'font-semibold text-primary'
                                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                                        }`}
                                                >
                                                    <span>{item.name}</span>
                                                </Button>
                                                {!isLast && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                            </React.Fragment>
                                        )
                                    })}
                                </div>
                            ) : (
                                <Label className="text-muted-foreground">All Files</Label>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="rounded-lg">
                                        <LayoutGrid className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52 rounded-xl ">
                                    <DropdownMenuItem onClick={() => setViewMode('list')} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <List className="h-4 w-4" />
                                            <span>List view</span>
                                        </div>
                                        {viewMode === 'list' ? <span className="text-xs text-primary">Selected</span> : null}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setViewMode('grid')} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <LayoutGrid className="h-4 w-4" />
                                            <span>Grid view</span>
                                        </div>
                                        {viewMode === 'grid' ? <span className="text-xs text-primary">Selected</span> : null}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setViewMode('detailed')} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Rows3 className="h-4 w-4" />
                                            <span>Detailed view</span>
                                        </div>
                                        {viewMode === 'detailed' ? <span className="text-xs text-primary">Selected</span> : null}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setCreateFolderOpen(true)}>
                                <FolderPlus className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-lg"
                                onClick={() => setAddFileOpen(true)}
                                disabled={!selectedFolderNode || selectedFolderNode.type !== 'folder'}
                            >
                                <FilePlus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto p-3">
                        {viewMode === 'grid' && (
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                                {filteredItems.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => handleItemClick(item)}
                                        className={`cursor-pointer rounded-xl border bg-card shadow-sm transition hover:shadow-md ${selectedFile?.id === item.id ? 'border-primary ring-1 ring-primary/30' : ''
                                            }`}
                                    >
                                        <div className="relative">
                                            <div className="absolute right-2 top-2 z-10">
                                                <ItemActions item={item} onRename={openRenameDialog} onDelete={openDeleteDialog} />
                                            </div>
                                            <div className="h-32 w-full overflow-hidden rounded-t-lg bg-slate-100">
                                                {getPreview(item)}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between gap-2 px-3 py-2">
                                            <span className="truncate text-sm">{item.name}</span>
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <ItemActions item={item} onRename={openRenameDialog} onDelete={openDeleteDialog} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {viewMode === 'list' && (
                            <div className="space-y-2">
                                {filteredItems.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => handleItemClick(item)}
                                        className={`flex cursor-pointer items-center gap-3 rounded-xl border bg-card px-3 py-3 transition hover:bg-muted/40 ${selectedFile?.id === item.id ? 'border-primary ring-1 ring-primary/30' : ''
                                            }`}
                                    >
                                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border bg-slate-50">
                                            {getPreview(item)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-sm font-medium">{item.name}</div>
                                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                                {getIcon(item)}
                                                <span>{item.type === 'folder' ? 'Folder' : 'File'}</span>
                                            </div>
                                        </div>
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <ItemActions item={item} onRename={openRenameDialog} onDelete={openDeleteDialog} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {viewMode === 'detailed' && (
                            <div className="overflow-hidden rounded-2xl border bg-card">
                                <div className="grid grid-cols-12 border-b bg-muted/40 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    <div className="col-span-5">Name</div>
                                    <div className="col-span-2">Type</div>
                                    <div className="col-span-2">Size</div>
                                    <div className="col-span-2">Created</div>
                                    <div className="col-span-1 text-right">More</div>
                                </div>

                                <div className="divide-y">
                                    {filteredItems.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => handleItemClick(item)}
                                            className={`grid cursor-pointer grid-cols-12 items-center px-4 py-3 transition hover:bg-muted/30 ${selectedFile?.id === item.id ? 'bg-primary/5' : ''
                                                }`}
                                        >
                                            <div className="col-span-5 flex min-w-0 items-center gap-3">
                                                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border bg-slate-50">
                                                    {getPreview(item)}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-medium">{item.name}</div>
                                                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                                        {getIcon(item)}
                                                        <span>{item.type === 'folder' ? 'Folder item' : 'File item'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-span-2 text-sm text-muted-foreground">
                                                {item.type === 'folder' ? 'Folder' : item.fileType?.toUpperCase() ?? 'FILE'}
                                            </div>
                                            <div className="col-span-2">
                                                <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                                                    <HardDrive className="h-4 w-4" />
                                                    <span>{item.type === 'folder' ? '--' : item.size ?? '--'}</span>
                                                </div>
                                            </div>
                                            <div className="col-span-2">
                                                <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                                                    <CalendarDays className="h-4 w-4" />
                                                    <span>{item.createdAt ?? '--'}</span>
                                                </div>
                                            </div>
                                            <div className="col-span-1 flex justify-end" onClick={(e) => e.stopPropagation()}>
                                                <ItemActions item={item} onRename={openRenameDialog} onDelete={openDeleteDialog} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!filteredItems.length && (
                            <div className="flex h-full min-h-75 items-center justify-center rounded-xl border border-dashed">
                                <div className="text-center">
                                    <div className="text-sm font-medium">No files found</div>
                                    <div className="mt-1 text-xs text-muted-foreground">
                                        Add a folder or upload a file to get started
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
                    <DialogContent className="p-1 lg:max-w-4xl">
                        <div className="max-h-[60vh] min-h-100 w-full">
                            {selectedFile?.fileType === 'image' && selectedFile.url && (
                                <img src={selectedFile.url} alt={selectedFile.name} className="h-full w-full object-contain" />
                            )}
                            {selectedFile?.fileType === 'video' && selectedFile.url && (
                                <video src={selectedFile.url} controls className="h-full w-full" />
                            )}
                            {selectedFile?.fileType === 'pdf' && selectedFile.url && (
                                <iframe src={selectedFile.url} className="h-[70vh] w-full" />
                            )}
                            {selectedFile?.fileType === 'other' && (
                                <div className="flex h-full min-h-100 flex-col items-center justify-center gap-3 text-sm">
                                    <File className="h-10 w-10 text-muted-foreground" />
                                    <div>Preview not available</div>
                                    {selectedFile.url ? (
                                        <a
                                            href={selectedFile.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                                        >
                                            <LinkIcon className="h-4 w-4" />
                                            <span>Open file</span>
                                        </a>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Dialog
                open={!!renameTarget}
                onOpenChange={(open) => {
                    if (!open) {
                        setRenameTarget(null)
                        setRenameValue('')
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{renameTarget?.type === 'folder' ? 'Rename Folder' : 'Rename File'}</DialogTitle>
                        <DialogDescription>
                            Update the name for <span className="font-medium">{renameTarget?.name}</span>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-2">
                        <Input
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            placeholder={renameTarget?.type === 'folder' ? 'Enter folder name' : 'Enter file name'}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setRenameTarget(null)
                                setRenameValue('')
                            }}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleRenameSubmit} disabled={!renameValue.trim() || isMutating}>
                            {updateFolderMutation.isPending || updateFileMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                'Rename'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!deleteTarget}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteTarget(null)
                    }
                }}
            >
                <DialogContent className="sm:max-w-md ">
                    <DialogHeader>
                        <DialogTitle>{deleteTarget?.type === 'folder' ? 'Delete Folder' : 'Delete File'}</DialogTitle>
                        <DialogDescription>
                            This action will permanently remove <span className="font-medium">{deleteTarget?.name}</span>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        Are you sure you want to delete this {deleteTarget?.type === 'folder' ? 'folder' : 'file'}?
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteSubmit} disabled={isMutating}>
                            {deleteFolderMutation.isPending || deleteFileMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                'Delete'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={createFolderOpen}
                onOpenChange={(open) => {
                    setCreateFolderOpen(open)
                    if (!open) {
                        setNewFolderName('')
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Folder</DialogTitle>
                        <DialogDescription>Create a new folder for your gallery files.</DialogDescription>
                    </DialogHeader>

                    <div className="py-2">
                        <Input
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="Enter folder name"
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateFolderOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddFolder} disabled={!newFolderName.trim() || addFolderMutation.isPending}>
                            {addFolderMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={addFileOpen}
                onOpenChange={(open) => {
                    setAddFileOpen(open)
                    if (!open) {
                        setNewFileTitle('')
                        setNewFileDescription('')
                        setNewFileLink('')
                        setNewFile(null)
                    }
                }}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Add File</DialogTitle>
                        <DialogDescription>
                            Upload a file or provide a file link inside{' '}
                            <span className="font-medium">{selectedFolderNode?.name ?? 'selected folder'}</span>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                                value={newFileTitle}
                                onChange={(e) => setNewFileTitle(e.target.value)}
                                placeholder="Enter file title"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                value={newFileDescription}
                                onChange={(e) => setNewFileDescription(e.target.value)}
                                placeholder="Enter description"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>File link</Label>
                            <Input
                                value={newFileLink}
                                onChange={(e) => setNewFileLink(e.target.value)}
                                placeholder="Paste file link"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Upload file</Label>
                            <Input
                                type="file"
                                onChange={(e) => setNewFile(e.target.files?.[0] ?? null)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddFileOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddFile}
                            disabled={addFileMutation.isPending || (!newFile && !newFileLink.trim())}
                        >
                            {addFileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add File'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}