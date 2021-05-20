export class ThresholdFilter {
    public level = 101;
    public opacity = 153;
    public calcAspectRatioFit(srcWidth: number, srcHeight: number, maxWidth: number, maxHeight: number) {
        const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
        return {
            width: srcWidth * ratio,
            height: srcHeight * ratio
        };
    }
    public getCanvas(w, h): HTMLCanvasElement {
        const c = <HTMLCanvasElement>document.getElementById('canvasThreshold');
        c.width = w;
        c.height = h;
        return c;
    }
    public getPixels(img, renderedSize) {
        const c = this.getCanvas(renderedSize.width, renderedSize.height);
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, c.width, c.height);
        return ctx.getImageData(0, 0, c.width, c.height);
    }
    public getThresholdPixels(pixels, threshold) {
        const d = pixels.data;
        for (let i = 0; i < d.length; i += 4) {
            const r = d[i];
            const g = d[i + 1];
            const b = d[i + 2];
            const v = (0.2126 * r + 0.7152 * g + 0.0722 * b >= threshold) ? 255 : 0;
            d[i] = d[i + 1] = d[i + 2] = v;
            if (v === 255) {
                d[i + 3] = 0; // alpha component
            } else {
                d[i + 3] = this.opacity;
            }
        }
        return pixels;
    }

    public clear(targetCanvasId) {
        const c = <HTMLCanvasElement>document.getElementById(targetCanvasId);
        const ctx = c.getContext('2d');
        ctx.clearRect(0, 0, c.width, c.height);
    }
    public apply(sourceImageId, targetCanvasId) {
        const img = <HTMLImageElement>document.getElementById(sourceImageId);
        const renderedSize = this.calcAspectRatioFit(img.width, img.height, img.parentElement.clientWidth, img.parentElement.clientHeight);
        const c = <HTMLCanvasElement>document.getElementById(targetCanvasId);
        const idata = this.getThresholdPixels(this.getPixels(img, renderedSize), this.level);
        c.width = idata.width;
        c.height = idata.height;
        const ctx = c.getContext('2d');
        ctx.putImageData(idata, 0, 0);
    }
}
