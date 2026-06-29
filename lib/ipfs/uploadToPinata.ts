export async function uploadPngToPinata(
    pngBuffer: Buffer,
    fileName: string
): Promise<string> {
    const jwt = process.env.PINATA_JWT;

    if (!jwt) {
        throw new Error("PINATA_JWT が設定されていません");
    }

    const formData = new FormData();

    const file = new File([new Uint8Array(pngBuffer)], fileName, {
        type: "image/png",
    });

    formData.append("file", file);
    formData.append("network", "public");
    formData.append("name", fileName);

    const response = await fetch("https://uploads.pinata.cloud/v3/files", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${jwt}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Pinataアップロードに失敗しました: ${errorText}`);
    }

    const result = await response.json();

    return result.data.cid;
}