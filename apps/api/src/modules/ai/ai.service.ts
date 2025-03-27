import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { SellersService } from '../sellers/sellers.service';
import axios from 'axios';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiKey = process.env.GOOGLE_API_KEY;
  private readonly apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  constructor(
    private prisma: PrismaService,
    private sellersService: SellersService
  ) {}

  async generateBusinessAdvice(
    userId: string,
    question: string,
    history: Message[] = []
  ) {
    try {
      // Get seller's business info and dashboard data
      const seller = await this.prisma.seller.findFirst({
        where: { userId },
        select: {
          businessName: true,
          businessType: true
        }
      });

      if (!seller) {
        throw new NotFoundException('Seller profile not found');
      }

      // Get dashboard data for last 30 days
      const dashboardData = await this.sellersService.getDashboardData(userId, '30d');

      const contextPrompt = `
        You're an AI assistant analyzing ${seller.businessName}'s performance data:
        - Orders: ${dashboardData.orderMetrics.total} (${dashboardData.orderMetrics.pending} pending)
        - Revenue: $${dashboardData.orderMetrics.totalAmount}
        - Products: ${dashboardData.productMetrics.totalProducts} (${dashboardData.productMetrics.lowStock} low stock)
        - Top seller: ${dashboardData.topProducts[0]?.name || 'N/A'}
        - Best region: ${dashboardData.revenueData.byGovernorate[0]?.governorate || 'N/A'}

        Rules:
        1. Never repeat the same metric twice in conversation
        2. If user says "all good" about something, don't mention it again
        3. For general help requests, suggest analyzing a specific area
        4. Each response must be unique from previous ones
        5. Ask about different aspects each time (products, regions, marketing, etc.)
        6. If user seems new, explain what you can help with
        7. Track conversation context and build on it

        Chat history: ${history.map(m => m.content).join(' | ')}
        User says: ${question}

        Respond naturally and suggest a specific area to improve.
      `;

      try {
        const response = await axios.post(
          `${this.apiUrl}?key=${this.apiKey}`,
          {
            contents: [{
              role: "user",
              parts: [{
                text: contextPrompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 150,
              topP: 0.8,
              topK: 40
            }
          },
          {
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );

        const aiResponse = response.data.candidates[0].content.parts[0].text;

        return {
          role: 'assistant' as const,
          content: aiResponse,
        };
      } catch (apiError) {
        this.logger.error('API Error:', apiError.response?.data || apiError.message);
        
        // Fallback response if API fails
        return {
          role: 'assistant' as const,
          content: "I'm sorry, I couldn't analyze your business data at the moment. Please try again later.",
        };
      }
    } catch (error) {
      this.logger.error('Error generating business advice:', error);
      throw error;
    }
  }
} 