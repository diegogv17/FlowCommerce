import { Module } from '@nestjs/common';
import { ListActivityUseCase } from '../activity/application/use-cases/list-activity.use-case';
import { ACTIVITY_REPOSITORY } from '../activity/domain/activity';
import { DrizzleActivityRepository } from '../activity/infrastructure/drizzle/drizzle-activity.repository';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { ClientsModule } from '../clients/clients.module';
import { GetClientUseCase } from '../clients/application/use-cases/get-client.use-case';
import { ListClientsUseCase } from '../clients/application/use-cases/list-clients.use-case';
import { GetDashboardUseCase } from '../dashboard/application/use-cases/get-dashboard.use-case';
import { DASHBOARD_REPOSITORY } from '../dashboard/domain/repositories/dashboard.repository';
import { DrizzleDashboardRepository } from '../dashboard/infrastructure/drizzle/drizzle-dashboard.repository';
import { FollowUpsModule } from '../follow-ups/follow-ups.module';
import { ListFollowUpsUseCase } from '../follow-ups/application/use-cases/follow-ups.use-cases';
import { FOLLOW_UPS_REPOSITORY } from '../follow-ups/domain/repositories/follow-up.repository';
import { DrizzleFollowUpRepository } from '../follow-ups/infrastructure/drizzle/drizzle-follow-up.repository';
import {
  GetLeadContextForAiUseCase,
  ListCatalogForAiUseCase,
} from '../integrations/application/ai-context.use-case';
import { ListLeadsUseCase } from '../leads/application/use-cases/list-leads.use-case';
import { LeadsModule } from '../leads/leads.module';
import { MessagesModule } from '../messages/messages.module';
import { ListProductsUseCase } from '../products/application/use-cases/list-products.use-case';
import { ProductsModule } from '../products/products.module';
import { ListQuotesUseCase } from '../quotes/application/use-cases/list-quotes.use-case';
import { QuotesModule } from '../quotes/quotes.module';
import { AssistantChatTools } from './application/chat-tools';
import { AI_MODEL_PROVIDER } from './application/ports/ai-model.provider';
import { AssistantChatUseCase } from './application/use-cases/assistant-chat.use-case';
import { GenerateQuoteDraftUseCase } from './application/use-cases/generate-quote-draft.use-case';
import { GetLeadInsightUseCase } from './application/use-cases/lead-insight.use-case';
import { SuggestRepliesUseCase } from './application/use-cases/suggest-replies.use-case';
import { GeminiAiModelProvider } from './infrastructure/gemini-ai-model.provider';
import { AssistantController } from './presentation/assistant.controller';

// Asistente de IA con Gemini (Vercel AI SDK): chat con tool calling,
// cotización preparada por IA, sugerencias de respuesta e insight del lead.
//
// No duplica reglas de negocio: reutiliza los CASOS DE USO de los otros
// módulos. Los que esos módulos no exportan (listados de leads, clientes,
// cotizaciones, productos, dashboard, seguimientos y actividad) se registran
// aquí como providers; son clases sin estado que solo dependen de
// AuthorizationService y de repositorios, así que se comportan igual que en
// su módulo de origen (assertCan + projectId en cada consulta).
@Module({
  imports: [
    AuthModule,
    AuthorizationModule,
    LeadsModule, // LEADS_REPOSITORY
    ClientsModule, // CLIENTS_REPOSITORY
    ProductsModule, // PRODUCTS_REPOSITORY
    QuotesModule, // QUOTES_REPOSITORY y CreateQuoteUseCase
    MessagesModule, // MESSAGES_REPOSITORY
    FollowUpsModule, // CreateFollowUpUseCase (herramienta crear_seguimiento)
  ],
  controllers: [AssistantController],
  providers: [
    { provide: AI_MODEL_PROVIDER, useClass: GeminiAiModelProvider },
    { provide: DASHBOARD_REPOSITORY, useClass: DrizzleDashboardRepository },
    { provide: FOLLOW_UPS_REPOSITORY, useClass: DrizzleFollowUpRepository },
    { provide: ACTIVITY_REPOSITORY, useClass: DrizzleActivityRepository },
    // Casos de uso reutilizados.
    GetLeadContextForAiUseCase,
    ListCatalogForAiUseCase,
    ListLeadsUseCase,
    GetClientUseCase,
    ListClientsUseCase,
    ListQuotesUseCase,
    ListProductsUseCase,
    GetDashboardUseCase,
    ListFollowUpsUseCase,
    ListActivityUseCase,
    // Propios del asistente.
    AssistantChatTools,
    AssistantChatUseCase,
    GenerateQuoteDraftUseCase,
    SuggestRepliesUseCase,
    GetLeadInsightUseCase,
  ],
})
export class AssistantModule {}
