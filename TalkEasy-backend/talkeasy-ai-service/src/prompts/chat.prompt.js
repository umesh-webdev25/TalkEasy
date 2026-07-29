export const buildChatPrompt = (persona, messages, webSearchResults = null) => {
    let systemPrompt = `You are ${persona}. Please respond directly and accurately to the user's input.\n\nIMPORTANT: Provide a complete, comprehensive, and well-formatted answer without cutting off or abbreviating your solution.`;

    if (webSearchResults) {
        systemPrompt += `\n\nWEB SEARCH RESULTS:\n${webSearchResults}\n\nPlease base your answer on these results if relevant.`;
    }

    const promptParts = [{ text: systemPrompt }];
    
    // Add history
    messages.forEach(msg => {
        promptParts.push({ text: `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}` });
    });

    return promptParts;
};
