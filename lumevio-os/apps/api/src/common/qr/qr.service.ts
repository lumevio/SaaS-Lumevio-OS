import { Injectable } from "@nestjs/common";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const QRCode = require("qrcode");

export type QrOutputFormat = "png" | "svg" | "data-url";

export type QrGenerateOptions = {
  format?: QrOutputFormat;
  size?: number;
  margin?: number;
};

@Injectable()
export class QrService {
  async generate(value: string, options: QrGenerateOptions = {}) {
    const format = options.format ?? "png";
    const size = this.clampSize(options.size ?? 768);
    const margin = this.clampMargin(options.margin ?? 2);

    if (format === "svg") {
      const svg = await QRCode.toString(value, {
        type: "svg",
        width: size,
        margin,
        errorCorrectionLevel: "M",
      });

      return {
        contentType: "image/svg+xml",
        extension: "svg",
        payload: Buffer.from(svg, "utf-8"),
      };
    }

    if (format === "data-url") {
      const dataUrl = await QRCode.toDataURL(value, {
        width: size,
        margin,
        errorCorrectionLevel: "M",
      });

      return {
        contentType: "text/plain; charset=utf-8",
        extension: "txt",
        payload: Buffer.from(dataUrl, "utf-8"),
      };
    }

    const pngBuffer = await QRCode.toBuffer(value, {
      type: "png",
      width: size,
      margin,
      errorCorrectionLevel: "M",
    });

    return {
      contentType: "image/png",
      extension: "png",
      payload: pngBuffer,
    };
  }

  private clampSize(size: number) {
    if (!Number.isFinite(size)) return 768;
    return Math.min(2048, Math.max(256, Math.floor(size)));
  }

  private clampMargin(margin: number) {
    if (!Number.isFinite(margin)) return 2;
    return Math.min(8, Math.max(0, Math.floor(margin)));
  }
}