import { parsePhoneNumber, CountryCode, getCountryCallingCode } from 'react-phone-number-input';
import en from 'react-phone-number-input/locale/en';

export interface FormattedWhatsAppNumber {
    flag: string;
    formattedNumber: string;
    country: CountryCode | undefined;
}

// Map of country codes to flag emojis (simplified version, can be expanded or replaced with a library)
// Since we don't have a library for flags installed, we can use a simple mapping or just use the country code text if we want to be safe, 
// but the user asked for a "banderita" (flag).
// A better approach might be to use the country code to generate the flag emoji code points.

function getFlagEmoji(countryCode: string) {
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}

export const formatWhatsAppNumber = (rawPhone: string): FormattedWhatsAppNumber | null => {
    if (!rawPhone) return null;

    // Remove @c.us if present
    let cleanPhone = rawPhone.replace('@c.us', '');

    // Ensure it starts with + if it doesn't
    if (!cleanPhone.startsWith('+')) {
        cleanPhone = '+' + cleanPhone;
    }

    try {
        const phoneNumber = parsePhoneNumber(cleanPhone);
        if (phoneNumber) {
            const country = phoneNumber.country;
            const flag = country ? getFlagEmoji(country) : '🌐';
            const formattedNumber = phoneNumber.formatInternational();

            return {
                flag,
                formattedNumber,
                country
            };
        }
    } catch (error) {
        console.error('Error parsing phone number:', error);
    }

    // Fallback if parsing fails
    return {
        flag: '🌐',
        formattedNumber: cleanPhone,
        country: undefined
    };
};

/**
 * Detects if a string is a Facebook/Instagram PSID (Page-Scoped ID)
 * PSIDs are long numeric strings that don't match valid phone number patterns
 */
export const isPSID = (value: string): boolean => {
    if (!value) return false;

    // Remove common phone number prefixes
    const cleaned = value.replace(/^\+/, '').replace('@c.us', '');

    // PSIDs are typically:
    // - All numeric
    // - Very long (usually 15+ digits)
    // - Don't match valid phone number patterns

    // If it's all numeric and very long, it's likely a PSID
    if (/^\d{15,}$/.test(cleaned)) {
        return true;
    }

    // Try to parse as phone number - if it fails, it might be a PSID
    try {
        const phoneNumber = parsePhoneNumber(value.startsWith('+') ? value : '+' + cleaned);
        // If parsing succeeds and we have a valid country, it's a real phone
        return !phoneNumber || !phoneNumber.country;
    } catch {
        // If parsing fails completely, assume it's a PSID
        return true;
    }
};
