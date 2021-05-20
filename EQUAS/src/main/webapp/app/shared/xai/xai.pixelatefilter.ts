import * as StackBlur from 'stackblur-canvas';

export class PixelateFilter {
    public originalWidth = 0;
    public originalHeight = 0;
    public newWidth = 0;
    public newHeight = 0;
    public renderedSize: any;

    public blurRadius = 0;
    public downSampleScale = 0;
    private levelLast = 0;
    private smoothingFactorLast = 0;
    public renderedSizeLast: any;

    public originalPixelCount() {
        return this.originalWidth * this.originalHeight;
    }
    public newPixelCount() {
        return this.newWidth * this.newHeight;
    }
    public pixelReductionPercent() {
        return this.newPixelCount() / this.originalPixelCount();
    }

    public constrainedWidth() {
        return Math.min(this.renderedSize.width, this.originalWidth);
    }
    public constrainedHeight() {
        return Math.min(this.renderedSize.height, this.originalHeight);
    }
    public constrainedPixelCount() {
        return this.constrainedWidth() * this.constrainedHeight();
    }

    public calcAspectRatioFit(srcWidth: number, srcHeight: number, maxWidth: number, maxHeight: number) {
        const _ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
        // console.log('window.innerHeight: ' + window.innerHeight);
        // console.log('window.innerHeight* .8: ' +  window.innerHeight * 0.8);
        // console.log('ratio: ' + _ratio);
        return {
            ratio: _ratio,
            width: Math.round(srcWidth * _ratio),
            height: Math.round(srcHeight * _ratio)
        };
    }
    public clear(targetCanvasId) {
        const c = <HTMLCanvasElement>document.getElementById(targetCanvasId);
        const ctx = c.getContext('2d');
        ctx.clearRect(0, 0, c.width, c.height);
    }
    public apply(sourceImageId: string, targetCanvasId: string, level: number, smoothingFactor: number, forceRedraw: boolean) {
        try {
            level = level;
            const img = <HTMLImageElement>document.getElementById(sourceImageId);
            this.renderedSize = this.calcAspectRatioFit(
                img.width,
                img.height,
                img.parentElement.clientWidth,
                window.innerHeight * 0.8 // Limit the height of the image to 80% of the browser height // img.parentElement.clientHeight
            );
            const c = <HTMLCanvasElement>document.getElementById(targetCanvasId);
            this.originalWidth = img.width;
            this.originalHeight = img.height;
            if (
                forceRedraw === false &&
                this.levelLast === level &&
                // this.smoothingFactorLast === smoothingFactor &&
                this.renderedSizeLast.width === this.renderedSize.width &&
                this.renderedSizeLast.height === this.renderedSize.height
            ) {
                // Inputs havent changed. Do nothing for performance sake
                return;
            }
            c.width = this.renderedSize.width;
            c.height = this.renderedSize.height;
            const ctx = c.getContext('2d');

            // console.log('level: ' + level);
            // console.log('img.width/img.height: ' + img.width  + '/' + img.height);
            // console.log('fw/fh: ' + fw + '/' + fh);
            // console.log('clientWidth/clientHeight: ' + img.parentElement.clientWidth + '/' + img.parentElement.clientHeight);
            // console.log('c.width/c.height: ' +  c.width + '/' + c.height);
            // console.log('renderedSize.width /renderedSize.height: ' + renderedSize.width + '/' + renderedSize.height);

            ctx.imageSmoothingEnabled = false; // Disable default canvas smoothing

            this.downSampleScale = 1 - level / 100;
            if (this.downSampleScale === 1) {
                this.downSampleScale = 0.99;
            } else if (this.downSampleScale === 0) {
                this.downSampleScale = 0.01;
            }

            // Downsample
            const newCanvas = this.downScaleImage(img, this.downSampleScale);
            this.newWidth = newCanvas.width;
            this.newHeight = newCanvas.height;

            // Upsample
            ctx.drawImage(newCanvas, 0, 0, newCanvas.width, newCanvas.height, 0, 0, this.renderedSize.width, this.renderedSize.height);

            // Apply smoothing. Dividing by window.devicePixelRatio accounts for the browser zoom level
            // this.blurRadius = Math.min(100, (this.originalPixelCount() / this.newPixelCount() / 2) * (smoothingFactor / 100));
            smoothingFactor = (100 - level) * (2.5 * this.renderedSize.ratio);
            this.blurRadius = Math.min(100, (this.originalPixelCount() / this.newPixelCount() / 2) * (smoothingFactor / 100));
            console.log('blurRadius: ' + this.blurRadius + '  ' + new Date().toTimeString());
            StackBlur.canvasRGB(c, 0, 0, c.width, c.height, this.blurRadius / window.devicePixelRatio);

            this.levelLast = level;
            this.smoothingFactorLast = smoothingFactor;
            this.renderedSizeLast = this.renderedSize;
        } catch (error) {
            console.log(error.message);
        }
    }

    // https://stackoverflow.com/questions/18922880/html5-canvas-resize-downscale-image-high-quality

    // scales the image by (float) scale < 1
    // returns a canvas containing the scaled image.
    downScaleImage(img, scale) {
        const imgCV = document.createElement('canvas');
        imgCV.width = img.width;
        imgCV.height = img.height;
        const imgCtx = imgCV.getContext('2d');
        imgCtx.drawImage(img, 0, 0);
        return this.downScaleCanvas(imgCV, scale);
    }

    // scales the canvas by (float) scale < 1
    // returns a new canvas containing the scaled image.
    downScaleCanvas(cv, scale) {
        if (!(scale < 1) || !(scale > 0)) {
            throw 'scale must be a positive number <1 ';
        }

        // scale = this.normaliseScale(scale);
        const sqScale = scale * scale; // square scale =  area of a source pixel within target
        const sw = cv.width; // source image width
        const sh = cv.height; // source image height
        const tw = Math.floor(sw * scale); // target image width
        const th = Math.floor(sh * scale); // target image height
        let sx = 0,
            sy = 0,
            sIndex = 0; // source x,y, index within source array
        let tx = 0,
            ty = 0,
            yIndex = 0,
            tIndex = 0; // target x,y, x,y index within target array
        let tX = 0,
            tY = 0; // rounded tx, ty
        let w = 0,
            nw = 0,
            wx = 0,
            nwx = 0,
            wy = 0,
            nwy = 0; // weight / next weight x / y
        // weight is weight of current source point within target.
        // next weight is weight of current source point within next target's point.
        let crossX = false; // does scaled px cross its current px right border ?
        let crossY = false; // does scaled px cross its current px bottom border ?
        const sBuffer = cv.getContext('2d').getImageData(0, 0, sw, sh).data; // source buffer 8 bit rgba
        const tBuffer = new Float32Array(3 * tw * th); // target buffer Float32 rgb
        let sR = 0,
            sG = 0,
            sB = 0; // source's current point r,g,b

        for (sy = 0; sy < sh; sy++) {
            ty = sy * scale; // y src position within target
            tY = 0 | ty; // rounded : target pixel's y
            yIndex = 3 * tY * tw; // line index within target array
            crossY = tY !== (0 | (ty + scale));
            if (crossY) {
                // if pixel is crossing botton target pixel
                wy = tY + 1 - ty; // weight of point within target pixel
                nwy = ty + scale - tY - 1; // ... within y+1 target pixel
            }
            for (sx = 0; sx < sw; sx++, sIndex += 4) {
                tx = sx * scale; // x src position within target
                tX = 0 | tx; // rounded : target pixel's x
                tIndex = yIndex + tX * 3; // target pixel index within target array
                crossX = tX !== (0 | (tx + scale));
                if (crossX) {
                    // if pixel is crossing target pixel's right
                    wx = tX + 1 - tx; // weight of point within target pixel
                    nwx = tx + scale - tX - 1; // ... within x+1 target pixel
                }
                sR = sBuffer[sIndex]; // retrieving r,g,b for curr src px.
                sG = sBuffer[sIndex + 1];
                sB = sBuffer[sIndex + 2];
                if (!crossX && !crossY) {
                    // pixel does not cross
                    // just add components weighted by squared scale.
                    tBuffer[tIndex] += sR * sqScale;
                    tBuffer[tIndex + 1] += sG * sqScale;
                    tBuffer[tIndex + 2] += sB * sqScale;
                } else if (crossX && !crossY) {
                    // cross on X only
                    w = wx * scale;
                    // add weighted component for current px
                    tBuffer[tIndex] += sR * w;
                    tBuffer[tIndex + 1] += sG * w;
                    tBuffer[tIndex + 2] += sB * w;
                    // add weighted component for next (tX+1) px
                    nw = nwx * scale;
                    tBuffer[tIndex + 3] += sR * nw;
                    tBuffer[tIndex + 4] += sG * nw;
                    tBuffer[tIndex + 5] += sB * nw;
                } else if (!crossX && crossY) {
                    // cross on Y only
                    w = wy * scale;
                    // add weighted component for current px
                    tBuffer[tIndex] += sR * w;
                    tBuffer[tIndex + 1] += sG * w;
                    tBuffer[tIndex + 2] += sB * w;
                    // add weighted component for next (tY+1) px
                    nw = nwy * scale;
                    tBuffer[tIndex + 3 * tw] += sR * nw;
                    tBuffer[tIndex + 3 * tw + 1] += sG * nw;
                    tBuffer[tIndex + 3 * tw + 2] += sB * nw;
                } else {
                    // crosses both x and y : four target points involved
                    // add weighted component for current px
                    w = wx * wy;
                    tBuffer[tIndex] += sR * w;
                    tBuffer[tIndex + 1] += sG * w;
                    tBuffer[tIndex + 2] += sB * w;
                    // for tX + 1; tY px
                    nw = nwx * wy;
                    tBuffer[tIndex + 3] += sR * nw;
                    tBuffer[tIndex + 4] += sG * nw;
                    tBuffer[tIndex + 5] += sB * nw;
                    // for tX ; tY + 1 px
                    nw = wx * nwy;
                    tBuffer[tIndex + 3 * tw] += sR * nw;
                    tBuffer[tIndex + 3 * tw + 1] += sG * nw;
                    tBuffer[tIndex + 3 * tw + 2] += sB * nw;
                    // for tX + 1 ; tY +1 px
                    nw = nwx * nwy;
                    tBuffer[tIndex + 3 * tw + 3] += sR * nw;
                    tBuffer[tIndex + 3 * tw + 4] += sG * nw;
                    tBuffer[tIndex + 3 * tw + 5] += sB * nw;
                }
            } // end for sx
        } // end for sy

        // create result canvas
        const resCV = document.createElement('canvas');
        resCV.width = tw;
        resCV.height = th;
        const resCtx = resCV.getContext('2d');
        const imgRes = resCtx.getImageData(0, 0, tw, th);
        const tByteBuffer = imgRes.data;
        // convert float32 array into a UInt8Clamped Array
        let pxIndex = 0; //
        for (sIndex = 0, tIndex = 0; pxIndex < tw * th; sIndex += 3, tIndex += 4, pxIndex++) {
            tByteBuffer[tIndex] = 0 | tBuffer[sIndex];
            tByteBuffer[tIndex + 1] = 0 | tBuffer[sIndex + 1];
            tByteBuffer[tIndex + 2] = 0 | tBuffer[sIndex + 2];
            tByteBuffer[tIndex + 3] = 255;
        }
        // writing result to canvas.
        resCtx.putImageData(imgRes, 0, 0);
        return resCV;
    }

    polyFillPerfNow() {
        // window.performance = window.performance ? window.performance : {};
        // window.performance.now = window.performance.now || window.performance.webkitNow || window.performance.msNow ||
        //     window.performance.mozNow || Date.now;
    }

    log2(v) {
        // taken from http://graphics.stanford.edu/~seander/bithacks.html
        const b = [0x2, 0xc, 0xf0, 0xff00, 0xffff0000];
        const S = [1, 2, 4, 8, 16];
        let i = 0,
            r = 0;

        for (i = 4; i >= 0; i--) {
            if (v & b[i]) {
                v >>= S[i];
                r |= S[i];
            }
        }
        return r;
    }
    // normalize a scale <1 to avoid some rounding issue with js numbers
    normaliseScale(s) {
        if (s > 1) {
            throw 's must be <1';
        }
        s = 0 | (1 / s);
        let l = this.log2(s);
        let mask = 1 << l;
        let accuracy = 4;
        while (accuracy && l) {
            l--;
            mask |= 1 << l;
            accuracy--;
        }
        return 1 / (s & mask);
    }
}
