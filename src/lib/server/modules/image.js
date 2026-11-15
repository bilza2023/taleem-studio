// src/lib/server/modules/image.js
import { makeAssetHandlers } from "./_asset.js";
import { deleteImageFile } from "../files/assetFiles.js";

export const { get, list, create, update, remove } = makeAssetHandlers("image", { onRemove: deleteImageFile });