// src/lib/server/modules/audio.js
import { makeAssetHandlers } from "./_asset.js";
import { deleteAudioFile } from "../files/assetFiles.js";

export const { get, list, create, update, remove } = makeAssetHandlers("audio", { onRemove: deleteAudioFile });