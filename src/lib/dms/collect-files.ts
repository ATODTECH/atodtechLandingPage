// Reads files and folders from a file picker or a drop, in the browser.

export type PickedFile = {
	file: File;
	/** Folder the file sat in, e.g. "Design/Logos". Empty for loose files. */
	folderPath: string;
};

export function fromFileList(files: FileList | null): PickedFile[] {
	return Array.from(files ?? []).map((file) => ({
		file,
		// Set when a folder was picked: "Design/Logos/logo.png".
		folderPath: file.webkitRelativePath.split("/").slice(0, -1).join("/"),
	}));
}

export class TooManyFilesError extends Error {}

/** Everything in a drop, walking into folders. Gives up past `limit` files. */
export async function fromDrop(
	data: DataTransfer,
	limit: number,
): Promise<PickedFile[]> {
	// Entries must be taken before the first await: the browser then empties
	// the DataTransfer.
	const entries = Array.from(data.items)
		.map((item) => item.webkitGetAsEntry())
		.filter((entry) => entry !== null);

	const picked: PickedFile[] = [];
	async function walk(entry: FileSystemEntry, folderPath: string) {
		if (entry.isFile) {
			const file = await new Promise<File>((resolve, reject) =>
				(entry as FileSystemFileEntry).file(resolve, reject),
			);
			picked.push({ file, folderPath });
			if (picked.length > limit) throw new TooManyFilesError();
			return;
		}
		// Hidden folders such as .git can hold thousands of files.
		if (entry.name.startsWith(".")) return;
		const path = folderPath ? `${folderPath}/${entry.name}` : entry.name;
		const reader = (entry as FileSystemDirectoryEntry).createReader();
		// Each read returns at most 100 entries, then an empty list at the end.
		for (;;) {
			const batch = await new Promise<FileSystemEntry[]>((resolve, reject) =>
				reader.readEntries(resolve, reject),
			);
			if (batch.length === 0) break;
			for (const child of batch) await walk(child, path);
		}
	}
	for (const entry of entries) await walk(entry, "");
	return picked;
}
