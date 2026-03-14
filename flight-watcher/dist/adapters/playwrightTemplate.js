/**
 * Template adapter for real browser extraction.
 * Disabled by default because many flight websites require hardening/captcha handling
 * and legal review per site ToS before production use.
 */
export const playwrightTemplateAdapter = {
    name: "playwright-template-disabled",
    enabledByDefault: false,
    async search(_input) {
        return {
            source: this.name,
            disabled: true,
            offers: [],
            errors: [
                "Disabled by default. Implement selectors and legal-safe scraping rules per target site."
            ]
        };
    }
};
