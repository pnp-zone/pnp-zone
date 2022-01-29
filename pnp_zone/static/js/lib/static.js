const baseUrl = document.static;
delete document.static;

export default function staticUrl(url) {
    return baseUrl + url;
}
