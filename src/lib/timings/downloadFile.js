// src/lib/timings/downloadFile.js
// Blob or text → browser download (goes to the Downloads folder)

export function downloadFile(data, name, type = "application/octet-stream") {
	const blob = data instanceof Blob ? data : new Blob([data], { type });
	const a = document.createElement("a");
	a.href = URL.createObjectURL(blob);
	a.download = name;
	a.click();
	setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}