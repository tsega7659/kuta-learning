const IMAGE_MARKDOWN = /(!\[[^\]]*\]\(https:\/\/[^)\s]+\))/g;

const getImageUrl = (markdown) => {
    const match = markdown.match(/^!\[([^\]]*)\]\((https:\/\/[^)\s]+)\)$/);
    if (!match) return null;

    try {
        const url = new URL(match[2]);
        if (url.hostname !== 'res.cloudinary.com') return null;
        return { alt: match[1], src: url.toString() };
    } catch {
        return null;
    }
};

export default function RichNoteContent({ content }) {
    if (!content) return null;

    return (
        <div className="space-y-3 text-sm leading-6 text-gray-700">
            {content.split(IMAGE_MARKDOWN).map((part, index) => {
                const image = getImageUrl(part);
                if (image) {
                    return (
                        <img
                            key={`${image.src}-${index}`}
                            src={image.src}
                            alt={image.alt}
                            loading="lazy"
                            className="mx-auto h-auto max-h-80 max-w-full rounded-xl object-contain"
                        />
                    );
                }

                if (!part) return null;
                return <p key={`text-${index}`} className="whitespace-pre-wrap">{part}</p>;
            })}
        </div>
    );
}
