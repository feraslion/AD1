CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"user_name" text,
	"user_email" text,
	"action" text NOT NULL,
	"module" text NOT NULL,
	"record_id" text,
	"details" text,
	"ip_address" text,
	"company_id" text,
	"branch_id" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "exchange_rates" (
	"id" text PRIMARY KEY NOT NULL,
	"currency_id" text NOT NULL,
	"currency_code" text NOT NULL,
	"rate" numeric NOT NULL,
	"effective_date" text NOT NULL,
	"notes" text,
	"company_id" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "exchange_rates_rate_check" CHECK ("exchange_rates"."rate" > 0)
);
--> statement-breakpoint
CREATE TABLE "purchase_invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"branch_id" text,
	"invoice_number" text NOT NULL,
	"supplier_invoice_number" text,
	"date" text NOT NULL,
	"due_date" text,
	"subtotal" numeric DEFAULT '0',
	"tax_amount" numeric DEFAULT '0',
	"discount_amount" numeric DEFAULT '0',
	"grand_total" numeric DEFAULT '0',
	"paid_amount" numeric DEFAULT '0',
	"remaining_amount" numeric DEFAULT '0',
	"payment_method" text DEFAULT 'cash',
	"status" text DEFAULT 'ordered',
	"supplier_id" text,
	"warehouse_id" text,
	"notes" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "purchase_invoices_invoice_number_unique" UNIQUE("invoice_number"),
	CONSTRAINT "purchase_invoices_status_check" CHECK ("purchase_invoices"."status" in ('draft', 'ordered', 'received', 'completed', 'cancelled'))
);
--> statement-breakpoint
CREATE TABLE "sales_invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"branch_id" text,
	"invoice_number" text NOT NULL,
	"date" text NOT NULL,
	"due_date" text,
	"subtotal" numeric DEFAULT '0',
	"tax_amount" numeric DEFAULT '0',
	"discount_amount" numeric DEFAULT '0',
	"grand_total" numeric DEFAULT '0',
	"paid_amount" numeric DEFAULT '0',
	"remaining_amount" numeric DEFAULT '0',
	"payment_method" text DEFAULT 'cash',
	"status" text DEFAULT 'paid',
	"customer_id" text,
	"cashier_id" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "sales_invoices_invoice_number_unique" UNIQUE("invoice_number"),
	CONSTRAINT "sales_invoices_status_check" CHECK ("sales_invoices"."status" in ('paid', 'unpaid', 'partially_paid', 'draft', 'cancelled')),
	CONSTRAINT "sales_invoices_payment_method_check" CHECK ("sales_invoices"."payment_method" in ('cash', 'card', 'credit', 'split'))
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_cashier_id_users_id_fk" FOREIGN KEY ("cashier_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_user_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_module_idx" ON "audit_logs" USING btree ("module");--> statement-breakpoint
CREATE INDEX "audit_logs_company_idx" ON "audit_logs" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "exchange_rates_currency_idx" ON "exchange_rates" USING btree ("currency_id");--> statement-breakpoint
CREATE INDEX "exchange_rates_code_idx" ON "exchange_rates" USING btree ("currency_code");--> statement-breakpoint
CREATE INDEX "exchange_rates_date_idx" ON "exchange_rates" USING btree ("effective_date");--> statement-breakpoint
CREATE INDEX "purchase_invoices_company_idx" ON "purchase_invoices" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "purchase_invoices_branch_idx" ON "purchase_invoices" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "purchase_invoices_date_idx" ON "purchase_invoices" USING btree ("date");--> statement-breakpoint
CREATE INDEX "purchase_invoices_supplier_idx" ON "purchase_invoices" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "sales_invoices_company_idx" ON "sales_invoices" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "sales_invoices_branch_idx" ON "sales_invoices" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "sales_invoices_date_idx" ON "sales_invoices" USING btree ("date");--> statement-breakpoint
CREATE INDEX "sales_invoices_customer_idx" ON "sales_invoices" USING btree ("customer_id");