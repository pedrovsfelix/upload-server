import { randomUUID } from 'node:crypto'
import { Readable } from 'node:stream'
import { eq } from 'drizzle-orm'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { db } from '@/infra/db'
import { schema } from '@/infra/db/schemas'
import { isLeft, isRight, unwrapEither } from '@/shared/either'
import { InvalidFileFormat } from './erros/invalid-file-format'
import { uploadImage } from './upload-image'

describe('upload image', () => {
  beforeAll(() => {
    vi.mock('@infra/storage/upload-file-to-storage', () => {
      return {
        uploadFileToStorage: vi.fn().mockImplementation(() => {
          return {
            key: `${randomUUID()}.jpg`,
            url: `https://storage.com/image.jpg`,
          }
        }),
      }
    })
  })

  vi.mock('@aws-sdk/lib-storage', () => {
    return {
      Upload: vi.fn().mockImplementation(() => ({
        done: vi.fn().mockResolvedValue({
          $metadata: { httpStatusCode: 200 },
        }),
      })),
    }
  })

  it('should be able to upload an image', async () => {
    const fileName = `${randomUUID()}.jpg`

    // system under test
    const sut = await uploadImage({
      fileName,
      contentType: 'image/jpg',
      contentStream: Readable.from([]),
    })

    expect(isRight(sut)).toBe(true)

    const result = await db
      .select()
      .from(schema.uploads)
      .where(eq(schema.uploads.name, fileName))

    expect(result).toHaveLength(1)
  })

  it('should be able to upload an invalid file', async () => {
    const fileName = `${randomUUID()}.pdf`

    // system under test
    const sut = await uploadImage({
      fileName,
      contentType: 'document/pdf',
      contentStream: Readable.from([]),
    })

    expect(isLeft(sut)).toBe(true)
    expect(unwrapEither(sut)).toBeInstanceOf(InvalidFileFormat)
  })
})
