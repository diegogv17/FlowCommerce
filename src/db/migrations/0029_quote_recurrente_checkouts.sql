CREATE TABLE "quote_recurrente_checkouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"quote_id" uuid NOT NULL,
	"attempt" integer NOT NULL,
	"checkout_id" varchar(255) NOT NULL,
	"checkout_url" text NOT NULL,
	"amount_in_cents" integer NOT NULL,
	"currency" varchar(3) NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"paid_at" timestamp with time zone,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quote_recurrente_checkouts" ADD CONSTRAINT "quote_recurrente_checkouts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_recurrente_checkouts" ADD CONSTRAINT "quote_recurrente_checkouts_quote_id_project_id_quotes_fk" FOREIGN KEY ("quote_id","project_id") REFERENCES "public"."quotes"("id","project_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "quote_recurrente_checkouts_checkout_id_unique" ON "quote_recurrente_checkouts" USING btree ("checkout_id");--> statement-breakpoint
CREATE UNIQUE INDEX "quote_recurrente_checkouts_quote_attempt_unique" ON "quote_recurrente_checkouts" USING btree ("quote_id","attempt");--> statement-breakpoint
CREATE UNIQUE INDEX "quote_recurrente_checkouts_active_quote_unique" ON "quote_recurrente_checkouts" USING btree ("quote_id") WHERE status <> 'EXPIRED';--> statement-breakpoint
CREATE INDEX "quote_recurrente_checkouts_project_id_quote_id_idx" ON "quote_recurrente_checkouts" USING btree ("project_id","quote_id");--> statement-breakpoint
ALTER TABLE "quote_recurrente_checkouts" ENABLE ROW LEVEL SECURITY;
