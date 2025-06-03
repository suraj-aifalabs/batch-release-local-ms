/* eslint-disable no-undef */
/* eslint-disable quotes */
const { sanitizeRules, sanitizeInput, decodeHtmlEntitiesNative } = require('../../server/utils/sanitizeRules');

describe('sanitizeRules', () => {
    describe('html', () => {
        it('should escape HTML special characters', () => {
            const input = `& < > " '`;
            const output = sanitizeRules.html(input);
            expect(output).toBe('&amp; &lt; &gt; &quot; &#x27;');
        });

        it('should return non-string values as is', () => {
            expect(sanitizeRules.html(null)).toBe(null);
            expect(sanitizeRules.html(undefined)).toBe(undefined);
            expect(sanitizeRules.html(123)).toBe('123');
        });
    });

    describe('sql', () => {
        it('should escape SQL special characters', () => {
            const input = `' \\ \0`;
            const output = sanitizeRules.sql(input);
            expect(output).toBe("'' \\\\ \\0");
        });

        it('should return non-string values as is', () => {
            expect(sanitizeRules.sql(null)).toBe(null);
        });
    });

    describe('ldap', () => {
        it('should escape LDAP special characters', () => {
            const input = `\\ * ( ) \0`;
            const output = sanitizeRules.ldap(input);
            expect(output).toBe('\\5c \\2a \\28 \\29 \\00');
        });
    });

    describe('path', () => {
        it('should sanitize file paths', () => {
            const input = '../some~path\0';
            const output = sanitizeRules.path(input);
            expect(output).toBe('/somepath');
        });
    });
});

describe('sanitizeInput', () => {
    it('should sanitize all string fields using html rule by default', () => {
        const input = {
            name: '<script>',
            description: '& something',
            age: 30,
        };
        const output = sanitizeInput(input);
        expect(output.name).toBe('&lt;script&gt;');
        expect(output.description).toBe('&amp; something');
        expect(output.age).toBe(30);
    });

    it('should apply path sanitizer for keys containing "path"', () => {
        const input = {
            filePath: '../secret',
            other: 'text',
        };
        const output = sanitizeInput(input);
        expect(output.filePath).toBe('/secret');
        expect(output.other).toBe('text');
    });

    it('should apply ldap sanitizer for keys containing "query" or "filter"', () => {
        const input = {
            userQuery: '(*)(*)',
            filterValue: '*abc*',
        };
        const output = sanitizeInput(input);
        expect(output.userQuery).toBe('\\28\\2a\\29\\28\\2a\\29');
        expect(output.filterValue).toBe('\\2aabc\\2a');
    });

    it('should return the same object if null or undefined', () => {
        expect(sanitizeInput(null)).toBeNull();
        expect(sanitizeInput(undefined)).toBeUndefined();
    });
});

describe('decodeHtmlEntitiesNative', () => {
    it('should decode &quot; and &amp; entities', () => {
        const input = 'Hello &quot;World&quot; &amp; everyone';
        const output = decodeHtmlEntitiesNative(input);
        expect(output).toBe('Hello "World" & everyone');
    });

    it('should return same string if no entities', () => {
        const input = 'Plain string';
        const output = decodeHtmlEntitiesNative(input);
        expect(output).toBe(input);
    });
});
