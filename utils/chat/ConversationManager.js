import { getFirstQuestion, getNextQuestion, validateResponse } from './questions';

export class ConversationManager {
  constructor(speakText) {
    this.speakText = speakText;
    this.currentQuestion = null;
  }

  async startConversation() {
    const firstQuestion = getFirstQuestion();
    this.currentQuestion = firstQuestion;
    await this.speakText(firstQuestion.text);
    return {
      role: 'assistant',
      text: firstQuestion.text
    };
  }

  async handleResponse(response) {
    if (!this.currentQuestion || !response.trim()) return null;

    try {
      // Validate the response - now properly awaiting the async validation
      const validation = await validateResponse(this.currentQuestion.id, response);
      
      // Speak the validation message (which now includes the next question if valid)
      await this.speakText(validation.message);

      // If endChat is true, end the conversation
      if (validation.endChat) {
        this.currentQuestion = null;
        return {
          userMessage: { role: 'user', text: response },
          assistantMessage: { role: 'assistant', text: validation.message }
        };
      }

      // If response is valid, move to next question
      if (validation.isValid) {
        const nextQuestion = getNextQuestion(this.currentQuestion.id);
        if (nextQuestion) {
          this.currentQuestion = nextQuestion;
          return {
            userMessage: { role: 'user', text: response },
            assistantMessage: { role: 'assistant', text: validation.message }
          };
        } else {
          // End of conversation
          this.currentQuestion = null;
          return {
            userMessage: { role: 'user', text: response },
            assistantMessage: { role: 'assistant', text: validation.message }
          };
        }
      }

      // If response is invalid, just return the validation message
      return {
        userMessage: { role: 'user', text: response },
        assistantMessage: { role: 'assistant', text: validation.message }
      };
    } catch (error) {
      console.error('Error handling response:', error);
      // Handle the error gracefully
      const errorMessage = "I'm having trouble processing that. Could you please try again?";
      await this.speakText(errorMessage);
      return {
        userMessage: { role: 'user', text: response },
        assistantMessage: { role: 'assistant', text: errorMessage }
      };
    }
  }

  getCurrentQuestion() {
    return this.currentQuestion;
  }
} 
 