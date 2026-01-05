// Enhanced storage implementation for comprehensive government platform

import {
  organizations,
  budgets,
  budgetCategories,
  vendors,
  payments,
  expenses,
  digitalWallets,
  paymentProviders,
  integrations,
  issuedCards,
  bankAccounts,
  complianceRecords,
  auditLogs,
  grants,
  assets,
  procurements,
  citizenServices,
  enhancedTransactions,
  type Budget,
  type InsertBudget,
  type BudgetCategory,
  type InsertBudgetCategory,
  type Vendor,
  type InsertVendor,
  type Payment,
  type InsertPayment,
  type Expense,
  type InsertExpense,
  type DigitalWallet,
  type InsertDigitalWallet,
  type PaymentProvider,
  type InsertPaymentProvider,
  type Integration,
  type InsertIntegration,
  type IssuedCard,
  type InsertIssuedCard,
  type BankAccount,
  type InsertBankAccount,
  type ComplianceRecord,
  type InsertComplianceRecord,
  type AuditLog,
  type InsertAuditLog,
  type Grant,
  type InsertGrant,
  type Asset,
  type InsertAsset,
  type Procurement,
  type InsertProcurement,
  type CitizenService,
  type InsertCitizenService,
  type EnhancedTransaction,
  type InsertEnhancedTransaction,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, or } from "drizzle-orm";
import { DatabaseStorage, type IStorage } from "./storage";

export interface IEnhancedStorage extends IStorage {
  // Payment Provider operations
  getPaymentProviders(organizationId: string): Promise<PaymentProvider[]>;
  getPaymentProvider(id: string): Promise<PaymentProvider | undefined>;
  createPaymentProvider(provider: InsertPaymentProvider): Promise<PaymentProvider>;
  updatePaymentProvider(id: string, provider: Partial<InsertPaymentProvider>): Promise<PaymentProvider>;
  
  // Integration operations
  getIntegrations(organizationId: string): Promise<Integration[]>;
  getIntegration(id: string): Promise<Integration | undefined>;
  createIntegration(integration: InsertIntegration): Promise<Integration>;
  updateIntegration(id: string, integration: Partial<InsertIntegration>): Promise<Integration>;
  
  // Card operations
  getIssuedCards(organizationId: string): Promise<IssuedCard[]>;
  getIssuedCard(id: string): Promise<IssuedCard | undefined>;
  createIssuedCard(card: InsertIssuedCard): Promise<IssuedCard>;
  updateIssuedCard(id: string, card: Partial<InsertIssuedCard>): Promise<IssuedCard>;
  getCardsByHolder(holderId: string): Promise<IssuedCard[]>;
  
  // Bank Account operations
  getBankAccounts(organizationId: string): Promise<BankAccount[]>;
  getBankAccount(id: string): Promise<BankAccount | undefined>;
  createBankAccount(account: InsertBankAccount): Promise<BankAccount>;
  updateBankAccount(id: string, account: Partial<InsertBankAccount>): Promise<BankAccount>;
  getVerifiedBankAccounts(organizationId: string): Promise<BankAccount[]>;
  
  // Compliance operations
  getComplianceRecords(organizationId: string): Promise<ComplianceRecord[]>;
  createComplianceRecord(record: InsertComplianceRecord): Promise<ComplianceRecord>;
  updateComplianceRecord(id: string, record: Partial<InsertComplianceRecord>): Promise<ComplianceRecord>;
  getComplianceByEntity(entityType: string, entityId: string): Promise<ComplianceRecord[]>;
  getPendingComplianceReviews(organizationId: string): Promise<ComplianceRecord[]>;
  
  // Audit operations
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(organizationId: string, limit?: number): Promise<AuditLog[]>;
  getAuditLogsByEntity(entityType: string, entityId: string): Promise<AuditLog[]>;
  getAuditLogsByUser(userId: string, limit?: number): Promise<AuditLog[]>;
  
  // Grant operations
  getGrants(organizationId: string): Promise<Grant[]>;
  getGrant(id: string): Promise<Grant | undefined>;
  createGrant(grant: InsertGrant): Promise<Grant>;
  updateGrant(id: string, grant: Partial<InsertGrant>): Promise<Grant>;
  getActiveGrants(organizationId: string): Promise<Grant[]>;
  getGrantsByManager(managerId: string): Promise<Grant[]>;
  
  // Asset operations
  getAssets(organizationId: string): Promise<Asset[]>;
  getAsset(id: string): Promise<Asset | undefined>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  updateAsset(id: string, asset: Partial<InsertAsset>): Promise<Asset>;
  getAssetsByCategory(organizationId: string, category: string): Promise<Asset[]>;
  getAssetsForMaintenance(organizationId: string): Promise<Asset[]>;
  
  // Procurement operations
  getProcurements(organizationId: string): Promise<Procurement[]>;
  getProcurement(id: string): Promise<Procurement | undefined>;
  createProcurement(procurement: InsertProcurement): Promise<Procurement>;
  updateProcurement(id: string, procurement: Partial<InsertProcurement>): Promise<Procurement>;
  getOpenProcurements(organizationId: string): Promise<Procurement[]>;
  getProcurementsByVendor(vendorId: string): Promise<Procurement[]>;
  
  // Citizen service operations
  getCitizenServices(organizationId: string): Promise<CitizenService[]>;
  createCitizenService(service: InsertCitizenService): Promise<CitizenService>;
  updateCitizenService(id: string, service: Partial<InsertCitizenService>): Promise<CitizenService>;
  getCitizenServicesByType(organizationId: string, serviceType: string): Promise<CitizenService[]>;
  getPendingCitizenPayments(organizationId: string): Promise<CitizenService[]>;
  
  // Enhanced Transaction operations
  getEnhancedTransactions(organizationId: string): Promise<EnhancedTransaction[]>;
  createEnhancedTransaction(transaction: InsertEnhancedTransaction): Promise<EnhancedTransaction>;
  updateEnhancedTransaction(id: string, transaction: Partial<InsertEnhancedTransaction>): Promise<EnhancedTransaction>;
  getTransactionsByProvider(organizationId: string, provider: string): Promise<EnhancedTransaction[]>;
  getTransactionsByDateRange(organizationId: string, startDate: Date, endDate: Date): Promise<EnhancedTransaction[]>;
  
  // Advanced analytics
  getComprehensiveAnalytics(organizationId: string): Promise<any>;
  getProviderAnalytics(organizationId: string): Promise<any>;
  getComplianceAnalytics(organizationId: string): Promise<any>;
  getGrantAnalytics(organizationId: string): Promise<any>;
}

export class EnhancedDatabaseStorage
  extends DatabaseStorage
  implements IEnhancedStorage {

  // Base storage operations delegated to DatabaseStorage
  override async getBudgets(organizationId: string): Promise<Budget[]> {
    return await super.getBudgets(organizationId);
  }

  override async getBudget(id: string): Promise<Budget | undefined> {
    return await super.getBudget(id);
  }

  override async createBudget(budget: InsertBudget): Promise<Budget> {
    return await super.createBudget(budget);
  }

  override async updateBudget(
    id: string,
    budget: Partial<InsertBudget>
  ): Promise<Budget> {
    return await super.updateBudget(id, budget);
  }

  override async getBudgetCategories(budgetId: string): Promise<BudgetCategory[]> {
    return await super.getBudgetCategories(budgetId);
  }

  override async createBudgetCategory(
    category: InsertBudgetCategory
  ): Promise<BudgetCategory> {
    return await super.createBudgetCategory(category);
  }

  override async getVendors(organizationId: string): Promise<Vendor[]> {
    return await super.getVendors(organizationId);
  }

  override async getVendor(id: string): Promise<Vendor | undefined> {
    return await super.getVendor(id);
  }

  override async createVendor(vendor: InsertVendor): Promise<Vendor> {
    return await super.createVendor(vendor);
  }

  override async updateVendor(
    id: string,
    vendor: Partial<InsertVendor>
  ): Promise<Vendor> {
    return await super.updateVendor(id, vendor);
  }

  override async getPayments(organizationId: string): Promise<Payment[]> {
    return await super.getPayments(organizationId);
  }

  override async getPayment(id: string): Promise<Payment | undefined> {
    return await super.getPayment(id);
  }

  override async createPayment(payment: InsertPayment): Promise<Payment> {
    return await super.createPayment(payment);
  }

  override async updatePayment(
    id: string,
    payment: Partial<InsertPayment>
  ): Promise<Payment> {
    return await super.updatePayment(id, payment);
  }

  override async getPendingPayments(organizationId: string): Promise<Payment[]> {
    return await super.getPendingPayments(organizationId);
  }

  override async getExpenses(organizationId: string): Promise<Expense[]> {
    return await super.getExpenses(organizationId);
  }

  override async getExpense(id: string): Promise<Expense | undefined> {
    return await super.getExpense(id);
  }

  override async createExpense(expense: InsertExpense): Promise<Expense> {
    return await super.createExpense(expense);
  }

  override async updateExpense(
    id: string,
    expense: Partial<InsertExpense>
  ): Promise<Expense> {
    return await super.updateExpense(id, expense);
  }

  override async getDigitalWallets(organizationId: string): Promise<DigitalWallet[]> {
    return await super.getDigitalWallets(organizationId);
  }

  override async getDigitalWallet(id: string): Promise<DigitalWallet | undefined> {
    return await super.getDigitalWallet(id);
  }

  override async createDigitalWallet(wallet: InsertDigitalWallet): Promise<DigitalWallet> {
    return await super.createDigitalWallet(wallet);
  }

  override async updateDigitalWallet(
    id: string,
    wallet: Partial<InsertDigitalWallet>
  ): Promise<DigitalWallet> {
    return await super.updateDigitalWallet(id, wallet);
  }

  override async getOrganizationStats(
    organizationId: string
  ): Promise<{
    totalBudget: string;
    monthlyExpenses: string;
    activeVendors: number;
    pendingPayments: number;
  }> {
    return await super.getOrganizationStats(organizationId);
  }

  override async getTopVendors(organizationId: string): Promise<Vendor[]> {
    return await super.getTopVendors(organizationId);
  }

  override async getRecentActivity(organizationId: string): Promise<any[]> {
    return await super.getRecentActivity(organizationId);
  }

  // Payment Provider operations
  async getPaymentProviders(organizationId: string): Promise<PaymentProvider[]> {
    return await db
      .select()
      .from(paymentProviders)
      .where(eq(paymentProviders.organizationId, organizationId))
      .orderBy(desc(paymentProviders.createdAt));
  }

  async getPaymentProvider(id: string): Promise<PaymentProvider | undefined> {
    const [provider] = await db.select().from(paymentProviders).where(eq(paymentProviders.id, id));
    return provider;
  }

  async createPaymentProvider(provider: InsertPaymentProvider): Promise<PaymentProvider> {
    const [newProvider] = await db
      .insert(paymentProviders)
      .values(provider)
      .returning();
    return newProvider;
  }

  async updatePaymentProvider(id: string, provider: Partial<InsertPaymentProvider>): Promise<PaymentProvider> {
    const [updated] = await db
      .update(paymentProviders)
      .set({ ...provider, updatedAt: new Date() })
      .where(eq(paymentProviders.id, id))
      .returning();
    return updated;
  }

  // Integration operations
  async getIntegrations(organizationId: string): Promise<Integration[]> {
    return await db
      .select()
      .from(integrations)
      .where(eq(integrations.organizationId, organizationId))
      .orderBy(desc(integrations.createdAt));
  }

  async getIntegration(id: string): Promise<Integration | undefined> {
    const [integration] = await db.select().from(integrations).where(eq(integrations.id, id));
    return integration;
  }

  async createIntegration(integration: InsertIntegration): Promise<Integration> {
    const [newIntegration] = await db
      .insert(integrations)
      .values(integration)
      .returning();
    return newIntegration;
  }

  async updateIntegration(id: string, integration: Partial<InsertIntegration>): Promise<Integration> {
    const [updated] = await db
      .update(integrations)
      .set({ ...integration, updatedAt: new Date() })
      .where(eq(integrations.id, id))
      .returning();
    return updated;
  }

  // Card operations
  async getIssuedCards(organizationId: string): Promise<IssuedCard[]> {
    return await db
      .select()
      .from(issuedCards)
      .where(eq(issuedCards.organizationId, organizationId))
      .orderBy(desc(issuedCards.createdAt));
  }

  async getIssuedCard(id: string): Promise<IssuedCard | undefined> {
    const [card] = await db.select().from(issuedCards).where(eq(issuedCards.id, id));
    return card;
  }

  async createIssuedCard(card: InsertIssuedCard): Promise<IssuedCard> {
    const [newCard] = await db
      .insert(issuedCards)
      .values(card)
      .returning();
    return newCard;
  }

  async updateIssuedCard(id: string, card: Partial<InsertIssuedCard>): Promise<IssuedCard> {
    const [updated] = await db
      .update(issuedCards)
      .set({ ...card, updatedAt: new Date() })
      .where(eq(issuedCards.id, id))
      .returning();
    return updated;
  }

  async getCardsByHolder(holderId: string): Promise<IssuedCard[]> {
    return await db
      .select()
      .from(issuedCards)
      .where(eq(issuedCards.holderId, holderId))
      .orderBy(desc(issuedCards.createdAt));
  }

  // Bank Account operations
  async getBankAccounts(organizationId: string): Promise<BankAccount[]> {
    return await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.organizationId, organizationId))
      .orderBy(desc(bankAccounts.createdAt));
  }

  async getBankAccount(id: string): Promise<BankAccount | undefined> {
    const [account] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, id));
    return account;
  }

  async createBankAccount(account: InsertBankAccount): Promise<BankAccount> {
    const [newAccount] = await db
      .insert(bankAccounts)
      .values(account)
      .returning();
    return newAccount;
  }

  async updateBankAccount(id: string, account: Partial<InsertBankAccount>): Promise<BankAccount> {
    const [updated] = await db
      .update(bankAccounts)
      .set({ ...account, updatedAt: new Date() })
      .where(eq(bankAccounts.id, id))
      .returning();
    return updated;
  }

  async getVerifiedBankAccounts(organizationId: string): Promise<BankAccount[]> {
    return await db
      .select()
      .from(bankAccounts)
      .where(
        and(
          eq(bankAccounts.organizationId, organizationId),
          eq(bankAccounts.isVerified, true),
          eq(bankAccounts.isActive, true)
        )
      );
  }

  // Compliance operations
  async getComplianceRecords(organizationId: string): Promise<ComplianceRecord[]> {
    return await db
      .select()
      .from(complianceRecords)
      .where(eq(complianceRecords.organizationId, organizationId))
      .orderBy(desc(complianceRecords.createdAt));
  }

  async createComplianceRecord(record: InsertComplianceRecord): Promise<ComplianceRecord> {
    const [newRecord] = await db
      .insert(complianceRecords)
      .values(record)
      .returning();
    return newRecord;
  }

  async updateComplianceRecord(id: string, record: Partial<InsertComplianceRecord>): Promise<ComplianceRecord> {
    const [updated] = await db
      .update(complianceRecords)
      .set({ ...record, updatedAt: new Date() })
      .where(eq(complianceRecords.id, id))
      .returning();
    return updated;
  }

  async getComplianceByEntity(entityType: string, entityId: string): Promise<ComplianceRecord[]> {
    return await db
      .select()
      .from(complianceRecords)
      .where(
        and(
          eq(complianceRecords.entityType, entityType),
          eq(complianceRecords.entityId, entityId)
        )
      )
      .orderBy(desc(complianceRecords.createdAt));
  }

  async getPendingComplianceReviews(organizationId: string): Promise<ComplianceRecord[]> {
    return await db
      .select()
      .from(complianceRecords)
      .where(
        and(
          eq(complianceRecords.organizationId, organizationId),
          eq(complianceRecords.status, 'pending_review')
        )
      )
      .orderBy(desc(complianceRecords.createdAt));
  }

  // Audit operations
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [newLog] = await db
      .insert(auditLogs)
      .values(log)
      .returning();
    return newLog;
  }

  async getAuditLogs(organizationId: string, limit: number = 100): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.organizationId, organizationId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }

  async getAuditLogsByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.entityType, entityType),
          eq(auditLogs.entityId, entityId)
        )
      )
      .orderBy(desc(auditLogs.createdAt));
  }

  async getAuditLogsByUser(userId: string, limit: number = 100): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }

  // Grant operations
  async getGrants(organizationId: string): Promise<Grant[]> {
    return await db
      .select()
      .from(grants)
      .where(eq(grants.organizationId, organizationId))
      .orderBy(desc(grants.createdAt));
  }

  async getGrant(id: string): Promise<Grant | undefined> {
    const [grant] = await db.select().from(grants).where(eq(grants.id, id));
    return grant;
  }

  async createGrant(grant: InsertGrant): Promise<Grant> {
    const [newGrant] = await db
      .insert(grants)
      .values(grant)
      .returning();
    return newGrant;
  }

  async updateGrant(id: string, grant: Partial<InsertGrant>): Promise<Grant> {
    const [updated] = await db
      .update(grants)
      .set({ ...grant, updatedAt: new Date() })
      .where(eq(grants.id, id))
      .returning();
    return updated;
  }

  async getActiveGrants(organizationId: string): Promise<Grant[]> {
    return await db
      .select()
      .from(grants)
      .where(
        and(
          eq(grants.organizationId, organizationId),
          eq(grants.status, 'active')
        )
      )
      .orderBy(desc(grants.startDate));
  }

  async getGrantsByManager(managerId: string): Promise<Grant[]> {
    return await db
      .select()
      .from(grants)
      .where(eq(grants.managedBy, managerId))
      .orderBy(desc(grants.createdAt));
  }

  // Asset operations
  async getAssets(organizationId: string): Promise<Asset[]> {
    return await db
      .select()
      .from(assets)
      .where(eq(assets.organizationId, organizationId))
      .orderBy(desc(assets.createdAt));
  }

  async getAsset(id: string): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.id, id));
    return asset;
  }

  async createAsset(asset: InsertAsset): Promise<Asset> {
    const [newAsset] = await db
      .insert(assets)
      .values(asset)
      .returning();
    return newAsset;
  }

  async updateAsset(id: string, asset: Partial<InsertAsset>): Promise<Asset> {
    const [updated] = await db
      .update(assets)
      .set({ ...asset, updatedAt: new Date() })
      .where(eq(assets.id, id))
      .returning();
    return updated;
  }

  async getAssetsByCategory(organizationId: string, category: string): Promise<Asset[]> {
    return await db
      .select()
      .from(assets)
      .where(
        and(
          eq(assets.organizationId, organizationId),
          eq(assets.category, category)
        )
      );
  }

  async getAssetsForMaintenance(organizationId: string): Promise<Asset[]> {
    return await db
      .select()
      .from(assets)
      .where(
        and(
          eq(assets.organizationId, organizationId),
          eq(assets.status, 'maintenance')
        )
      );
  }

  // Procurement operations
  async getProcurements(organizationId: string): Promise<Procurement[]> {
    return await db
      .select()
      .from(procurements)
      .where(eq(procurements.organizationId, organizationId))
      .orderBy(desc(procurements.createdAt));
  }

  async getProcurement(id: string): Promise<Procurement | undefined> {
    const [procurement] = await db.select().from(procurements).where(eq(procurements.id, id));
    return procurement;
  }

  async createProcurement(procurement: InsertProcurement): Promise<Procurement> {
    const [newProcurement] = await db
      .insert(procurements)
      .values(procurement)
      .returning();
    return newProcurement;
  }

  async updateProcurement(id: string, procurement: Partial<InsertProcurement>): Promise<Procurement> {
    const [updated] = await db
      .update(procurements)
      .set({ ...procurement, updatedAt: new Date() })
      .where(eq(procurements.id, id))
      .returning();
    return updated;
  }

  async getOpenProcurements(organizationId: string): Promise<Procurement[]> {
    return await db
      .select()
      .from(procurements)
      .where(
        and(
          eq(procurements.organizationId, organizationId),
          or(
            eq(procurements.status, 'published'),
            eq(procurements.status, 'bidding')
          )
        )
      );
  }

  async getProcurementsByVendor(vendorId: string): Promise<Procurement[]> {
    return await db
      .select()
      .from(procurements)
      .where(eq(procurements.awardedVendorId, vendorId))
      .orderBy(desc(procurements.awardDate));
  }

  // Citizen service operations
  async getCitizenServices(organizationId: string): Promise<CitizenService[]> {
    return await db
      .select()
      .from(citizenServices)
      .where(eq(citizenServices.organizationId, organizationId))
      .orderBy(desc(citizenServices.createdAt));
  }

  async createCitizenService(service: InsertCitizenService): Promise<CitizenService> {
    const [newService] = await db
      .insert(citizenServices)
      .values(service)
      .returning();
    return newService;
  }

  async updateCitizenService(id: string, service: Partial<InsertCitizenService>): Promise<CitizenService> {
    const [updated] = await db
      .update(citizenServices)
      .set({ ...service, updatedAt: new Date() })
      .where(eq(citizenServices.id, id))
      .returning();
    return updated;
  }

  async getCitizenServicesByType(organizationId: string, serviceType: string): Promise<CitizenService[]> {
    return await db
      .select()
      .from(citizenServices)
      .where(
        and(
          eq(citizenServices.organizationId, organizationId),
          eq(citizenServices.serviceType, serviceType)
        )
      );
  }

  async getPendingCitizenPayments(organizationId: string): Promise<CitizenService[]> {
    return await db
      .select()
      .from(citizenServices)
      .where(
        and(
          eq(citizenServices.organizationId, organizationId),
          eq(citizenServices.paymentStatus, 'pending')
        )
      );
  }

  // Enhanced Transaction operations
  async getEnhancedTransactions(organizationId: string): Promise<EnhancedTransaction[]> {
    return await db
      .select()
      .from(enhancedTransactions)
      .where(eq(enhancedTransactions.organizationId, organizationId))
      .orderBy(desc(enhancedTransactions.createdAt));
  }

  async createEnhancedTransaction(transaction: InsertEnhancedTransaction): Promise<EnhancedTransaction> {
    const [newTransaction] = await db
      .insert(enhancedTransactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async updateEnhancedTransaction(id: string, transaction: Partial<InsertEnhancedTransaction>): Promise<EnhancedTransaction> {
    const [updated] = await db
      .update(enhancedTransactions)
      .set({ ...transaction, updatedAt: new Date() })
      .where(eq(enhancedTransactions.id, id))
      .returning();
    return updated;
  }

  async getTransactionsByProvider(organizationId: string, provider: string): Promise<EnhancedTransaction[]> {
    return await db
      .select()
      .from(enhancedTransactions)
      .where(
        and(
          eq(enhancedTransactions.organizationId, organizationId),
          eq(enhancedTransactions.provider, provider as any)
        )
      )
      .orderBy(desc(enhancedTransactions.createdAt));
  }

  async getTransactionsByDateRange(organizationId: string, startDate: Date, endDate: Date): Promise<EnhancedTransaction[]> {
    return await db
      .select()
      .from(enhancedTransactions)
      .where(
        and(
          eq(enhancedTransactions.organizationId, organizationId),
          gte(enhancedTransactions.createdAt, startDate),
          lte(enhancedTransactions.createdAt, endDate)
        )
      )
      .orderBy(desc(enhancedTransactions.createdAt));
  }

  // Advanced analytics
  async getComprehensiveAnalytics(organizationId: string): Promise<any> {
    const [orgBudgets, orgExpenses, orgPayments, orgVendors, orgGrants, orgAssets] = await Promise.all([
      super.getBudgets(organizationId),
      super.getExpenses(organizationId),
      super.getPayments(organizationId),
      super.getVendors(organizationId),
      this.getGrants(organizationId),
      this.getAssets(organizationId),
    ]);

    const parseAmount = (value: string | null | undefined) => parseFloat(value ?? '0');

    const totalBudget = orgBudgets.reduce((sum, budget) => sum + parseAmount(budget.totalAmount), 0);
    const totalExpenses = orgExpenses.reduce((sum, expense) => sum + parseAmount(expense.amount), 0);
    const totalPayments = orgPayments.reduce((sum, payment) => sum + parseAmount(payment.amount), 0);

    const activeVendors = orgVendors.filter(vendor => vendor.status === 'active').length;
    const activeGrants = orgGrants.filter(grant => grant.status === 'active').length;
    const totalAssetsCount = orgAssets.length;
    const totalAssetValue = orgAssets.reduce((sum, asset) => sum + parseAmount(asset.currentValue), 0);

    return {
      financial: {
        totalBudget: totalBudget.toFixed(2),
        totalExpenses: totalExpenses.toFixed(2),
        totalPayments: totalPayments.toFixed(2),
      },
      operational: {
        activeVendors,
        activeGrants,
        totalAssets: {
          count: totalAssetsCount,
          value: totalAssetValue.toFixed(2),
        },
      },
    };
  }

  async getProviderAnalytics(organizationId: string): Promise<any> {
    const providers = await this.getPaymentProviders(organizationId);
    const transactions = await this.getEnhancedTransactions(organizationId);

    const providerStats = providers.map(provider => {
      const providerTx = transactions.filter(tx => tx.provider === provider.provider);
      const totalVolume = providerTx.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
      const avgTransaction = providerTx.length > 0 ? totalVolume / providerTx.length : 0;

      return {
        provider: provider.provider,
        isActive: provider.isActive,
        transactionCount: providerTx.length,
        totalVolume,
        avgTransaction,
        lastActivity: providerTx[0]?.createdAt || null
      };
    });

    return providerStats;
  }

  async getComplianceAnalytics(organizationId: string): Promise<any> {
    const records = await this.getComplianceRecords(organizationId);
    
    const statusBreakdown = records.reduce((acc, record) => {
      const status = record.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgRiskScore = records.reduce((sum, r) => sum + (r.riskScore || 0), 0) / records.length || 0;

    const highRiskEntities = records.filter(r => (r.riskScore || 0) > 7);
    const pendingReviews = records.filter(r => r.status === 'pending_review');

    return {
      totalRecords: records.length,
      statusBreakdown,
      avgRiskScore,
      highRiskCount: highRiskEntities.length,
      pendingReviewCount: pendingReviews.length,
      complianceRate: ((records.length - pendingReviews.length) / records.length) * 100
    };
  }

  async getGrantAnalytics(organizationId: string): Promise<any> {
    const allGrants = await this.getGrants(organizationId);
    const activeGrants = await this.getActiveGrants(organizationId);

    const totalGrantAmount = allGrants.reduce((sum, g) => sum + parseFloat(g.amount || '0'), 0);
    const totalReceived = allGrants.reduce((sum, g) => sum + parseFloat(g.amountReceived || '0'), 0);
    const totalSpent = allGrants.reduce((sum, g) => sum + parseFloat(g.amountSpent || '0'), 0);

    const utilizationRate = totalGrantAmount > 0 ? (totalSpent / totalGrantAmount) * 100 : 0;

    return {
      totalGrants: allGrants.length,
      activeGrants: activeGrants.length,
      totalAmount: totalGrantAmount,
      totalReceived,
      totalSpent,
      remainingBalance: totalReceived - totalSpent,
      utilizationRate,
      avgGrantSize: totalGrantAmount / allGrants.length || 0
    };
  }

}

// Export the enhanced storage instance
export const enhancedStorage = new EnhancedDatabaseStorage();
