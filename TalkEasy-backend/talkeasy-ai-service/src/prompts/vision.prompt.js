export const buildVisionPrompt = (userPrompt, imageParts) => {
    const systemPrompt = `You are an expert AI vision assistant. Analyze the provided images and respond to the user's query.\n\nQuery: ${userPrompt}`;
    
    return [
        { text: systemPrompt },
        ...imageParts
    ];
};
