export const formatAIResponse = (text, type = 'chat', metadata = {}) => {
    // Shared formatting logic
    let formattedText = text;

    // We can add specific formatting rules based on type (e.g., chat, code, markdown)
    if (type === 'code') {
        if (!formattedText.startsWith('```')) {
            formattedText = `\`\`\`\n${formattedText}\n\`\`\``;
        }
    }

    return {
        content: formattedText,
        metadata: {
            timestamp: new Date().toISOString(),
            ...metadata
        }
    };
};
