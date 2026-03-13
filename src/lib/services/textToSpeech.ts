// Placeholder for text-to-speech integration
export const textToSpeechService = {
  synthesize: async (_text: string, _voiceType: string): Promise<ArrayBuffer> => {
    console.log("Text-to-speech not yet implemented");
    return new ArrayBuffer(0);
  },
};
