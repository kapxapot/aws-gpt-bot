import { putItem, updateItem } from "../lib/database";
import { ImageRequest } from "../entities/imageRequest";
import { Unsaved } from "../lib/types";

const imageRequestsTable = process.env.IMAGE_REQUESTS_TABLE!;

export const storeImageRequest = async (request: Unsaved<ImageRequest>) =>
  await putItem<ImageRequest>(
    imageRequestsTable,
    request
  );

export const updateImageRequest = async (request: ImageRequest, changes: Partial<ImageRequest>): Promise<ImageRequest> =>
  await updateItem<ImageRequest>(
    imageRequestsTable,
    {
      id: request.id
    },
    changes
  );
