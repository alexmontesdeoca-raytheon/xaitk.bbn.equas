import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml, SafeStyle, SafeScript, SafeUrl, SafeResourceUrl } from '@angular/platform-browser';
@Pipe({ name: 'findLanguageFromKey' })
export class FindLanguageFromKeyPipe implements PipeTransform {
    private languages: any = {
        nl: { name: 'Nederlands' },
        en: { name: 'English' },
        fr: { name: 'Français' },
        de: { name: 'Deutsch' },
        it: { name: 'Italiano' },
        ja: { name: '日本語' }
        // jhipster-needle-i18n-language-key-pipe - JHipster will add/remove languages in this object
    };
    transform(lang: string): string {
        return this.languages[lang].name;
    }
}

@Pipe({ name: 'safe' })
export class SafePipe implements PipeTransform {
    constructor(protected sanitizer: DomSanitizer) {}

    transform(htmlString: string): any {
        return this.sanitizer.bypassSecurityTrustHtml(htmlString);
    }
}
