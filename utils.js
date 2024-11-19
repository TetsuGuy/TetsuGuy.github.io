export function isValidURL(string) {
    try {
        new URL(string); // Throws an error if invalid
        return true;
    } catch (e) {
        return false;
    }
}