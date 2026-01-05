// Enhanced API routes for comprehensive government platform

import type { Express } from "express";
import { isAuthenticated } from "./replitAuth";
import { enhancedStorage } from "./enhanced-storage";
import { serviceRegistry } from "./services/service-registry";
import bulkOperationsRouter from "./routes/bulk-operations";
import { employeeVerificationService } from "./services/employee-verification";
import { z } from "zod";
import {
  insertPaymentProviderSchema,
  insertIntegrationSchema,
  insertIssuedCardSchema,
  insertBankAccountSchema,
  insertComplianceRecordSchema,
  insertAuditLogSchema,
  insertGrantSchema,
  insertAssetSchema,
  insertProcurementSchema,
  insertCitizenServiceSchema,
  insertEnhancedTransactionSchema,
} from "@shared/schema";

export function registerEnhancedRoutes(app: Express) {
  // ========== BULK OPERATIONS ROUTES ==========
  app.use('/api', bulkOperationsRouter);

  // ========== EMPLOYEE CARD MANAGEMENT ROUTES ==========
  
  // Get employee's own cards
  app.get("/api/employee/cards", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Fetch cards issued to this employee using holderId
      const cards = await enhancedStorage.getCardsByHolder(userId);
      
      res.json(cards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cards" });
    }
  });

  // Get employee spending summary
  app.get("/api/employee/spending-summary", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      
      // Calculate spending summary (mock data for now)
      const summary = {
        currentMonth: "2,450.00",
        monthlyLimit: "5,000.00",
        available: "2,550.00",
        pending: "125.50"
      };
      
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch spending summary" });
    }
  });

  // Employee freeze/unfreeze their own card
  app.patch("/api/employee/cards/:cardId/:action", isAuthenticated, async (req: any, res) => {
    try {
      const { cardId, action } = req.params;
      const userId = req.user.claims.sub;
      
      // Verify card belongs to employee
      const card = await enhancedStorage.getIssuedCard(cardId);
      
      if (!card || card.holderId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Update card status (use blocked for freeze, active for unfreeze)
      await enhancedStorage.updateIssuedCard(cardId, {
        status: action === 'freeze' ? 'blocked' : 'active'
      });
      
      res.json({ success: true, status: action === 'freeze' ? 'blocked' : 'active' });
    } catch (error) {
      res.status(500).json({ message: "Failed to update card status" });
    }
  });

  // Set card PIN (note: PIN functionality should be handled by payment provider)
  app.post("/api/employee/cards/:cardId/pin", isAuthenticated, async (req: any, res) => {
    try {
      const { cardId } = req.params;
      const { pin } = req.body;
      const userId = req.user.claims.sub;
      
      // Validate PIN format
      if (!pin || !/^\d{4}$/.test(pin)) {
        return res.status(400).json({ message: "Invalid PIN format" });
      }
      
      // Verify card belongs to employee
      const card = await enhancedStorage.getIssuedCard(cardId);
      
      if (!card || card.holderId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get the payment provider service
      const user = await enhancedStorage.getUser(userId);
      if (!user?.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      const provider = serviceRegistry.getService(user.organizationId, 'payment', card.provider);
      
      // In production, call the provider's API to set PIN
      // Example: if (provider && provider.setCardPIN) {
      //   await provider.setCardPIN(card.externalCardId, pin);
      // }
      
      // For now, acknowledge the request
      // TODO: Implement actual PIN setting via payment provider API
      res.json({ 
        success: true, 
        message: "PIN setting is handled by the payment provider. Please contact support for PIN management." 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to set PIN" });
    }
  });

  // Report card lost/stolen
  app.post("/api/employee/cards/:cardId/report", isAuthenticated, async (req: any, res) => {
    try {
      const { cardId } = req.params;
      const { reason } = req.body;
      const userId = req.user.claims.sub;
      
      // Verify card belongs to employee
      const card = await enhancedStorage.getIssuedCard(cardId);
      
      if (!card || card.holderId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Permanently deactivate card
      await enhancedStorage.updateIssuedCard(cardId, {
        status: 'inactive'
      });
      
      // Create audit log
      await enhancedStorage.createAuditLog({
        organizationId: card.organizationId || 'default',
        userId: userId,
        action: 'card_reported',
        entityType: 'card',
        entityId: cardId,
        metadata: { reason, cardId },
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || ''
      });
      
      res.json({ success: true, message: "Card reported and deactivated" });
    } catch (error) {
      res.status(500).json({ message: "Failed to report card" });
    }
  });
  
  // ========== ACH APPROVAL WORKFLOWS ==========
  
  // Create ACH transfer with approval requirement
  app.post("/api/ach/transfers/create", isAuthenticated, async (req: any, res) => {
    try {
      const { amount, recipientAccount, routingNumber, transferType, description } = req.body;
      const userId = req.user.claims.sub;
      const user = await enhancedStorage.getUser(userId);
      
      if (!user?.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      // Determine if approval needed based on amount
      const requiresApproval = parseFloat(amount) > 10000; // Amounts over $10,000 need approval
      
      const transfer = {
        id: `ach_${Date.now()}`,
        initiatedBy: userId,
        amount,
        recipientAccount,
        routingNumber, 
        transferType,
        description,
        status: requiresApproval ? 'pending' : 'approved',
        requiresApproval,
        approvalLevel: parseFloat(amount) > 50000 ? 2 : 1, // 2-level approval for amounts > $50k
        createdAt: new Date().toISOString(),
        approvals: []
      };
      
      // Store transfer
      const transferStatus = requiresApproval ? 'pending' : 'approved';
      await enhancedStorage.createEnhancedTransaction({
        organizationId: user.organizationId,
        paymentType: 'ach',
        amount: amount.toString(),
        currency: 'USD',
        status: transferStatus as "pending" | "approved",
        type: 'debit',
        provider: 'dwolla',
        description,
        metadata: transfer
      });
      
      res.json({ 
        success: true, 
        transfer,
        message: requiresApproval ? 
          `Transfer requires approval (Amount: $${amount})` : 
          'Transfer approved and queued for processing'
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to create ACH transfer" });
    }
  });

  // Get pending approvals
  app.get("/api/ach/approvals/pending", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await enhancedStorage.getUser(userId);
      const userRole = user?.role;
      
      if (userRole !== 'admin' && userRole !== 'manager') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      
      if (!user?.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      // Fetch pending ACH transfers
      const transactions = await enhancedStorage.getEnhancedTransactions(user.organizationId);
      const pendingApprovals = transactions.filter((t: any) => 
        t.paymentType === 'ach' && 
        t.status === 'pending'
      );
      
      res.json(pendingApprovals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending approvals" });
    }
  });

  // Approve/Reject ACH transfer
  app.post("/api/ach/approvals/:transferId", isAuthenticated, async (req: any, res) => {
    try {
      const { transferId } = req.params;
      const { action, comments } = req.body;
      const userId = req.user.claims.sub;
      const user = await enhancedStorage.getUser(userId);
      const userRole = user?.role;
      
      if (userRole !== 'admin' && userRole !== 'manager') {
        return res.status(403).json({ message: "Insufficient permissions to approve transfers" });
      }
      
      if (!user?.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      // Get transfer details
      const transactions = await enhancedStorage.getEnhancedTransactions(user.organizationId);
      const transfer = transactions.find((t: any) => t.id === transferId);
      
      if (!transfer) {
        return res.status(404).json({ message: "Transfer not found" });
      }
      
      const metadata = transfer.metadata as any;
      
      // Check approval level requirements
      if (metadata?.approvalLevel === 2 && transfer.status === 'pending') {
        // First level approval for 2-level requirement
        if (action === 'approve') {
          if (!metadata.approvals) {
            metadata.approvals = [];
          }
          metadata.approvals.push({
            approvedBy: userId,
            approvedAt: new Date().toISOString(),
            level: 1,
            comments
          });
          
          await enhancedStorage.updateEnhancedTransaction(transferId, {
            status: 'processing',
            metadata
          });
          
          res.json({ 
            success: true, 
            message: "First level approval granted. Awaiting second level approval." 
          });
        } else {
          await enhancedStorage.updateEnhancedTransaction(transferId, {
            status: 'cancelled',
            metadata: {
              ...metadata,
              rejectedBy: userId,
              rejectedAt: new Date().toISOString(),
              rejectionReason: comments
            }
          });
          
          res.json({ success: true, message: "Transfer rejected" });
        }
      } else {
        // Final approval
        if (action === 'approve') {
          if (!metadata?.approvals) {
            if (!metadata) {
              transfer.metadata = {};
            }
            (transfer.metadata as any).approvals = [];
          }
          (transfer.metadata as any).approvals.push({
            approvedBy: userId,
            approvedAt: new Date().toISOString(),
            level: metadata?.approvalLevel === 2 ? 2 : 1,
            comments
          });
          
          // Process the ACH transfer
          const provider = serviceRegistry.getService(
            transfer.organizationId,
            'banking',
            'dwolla'
          );
          
          if (provider && provider.processACH) {
            const result = await provider.processACH(
              parseFloat(transfer.amount),
              'default_account',
              metadata?.recipientAccount,
              'standard'
            );
            
            await enhancedStorage.updateEnhancedTransaction(transferId, {
              status: result.success ? 'completed' : 'failed',
              providerTransactionId: result.providerTransactionId,
              metadata: {
                ...metadata,
                processedAt: new Date().toISOString(),
                processingResult: result
              }
            });
            
            res.json({ 
              success: true, 
              message: result.success ? 
                "Transfer approved and processed successfully" : 
                "Transfer approved but processing failed",
              result
            });
          } else {
            await enhancedStorage.updateEnhancedTransaction(transferId, {
              status: 'approved',
              metadata: transfer.metadata as any
            });
            
            res.json({ 
              success: true, 
              message: "Transfer approved and queued for processing" 
            });
          }
        } else {
          await enhancedStorage.updateEnhancedTransaction(transferId, {
            status: 'cancelled',
            metadata: {
              ...metadata,
              rejectedBy: userId,
              rejectedAt: new Date().toISOString(),
              rejectionReason: comments
            }
          });
          
          res.json({ success: true, message: "Transfer rejected" });
        }
      }
      
      // Create audit log
      await enhancedStorage.createAuditLog({
        organizationId: transfer.organizationId,
        userId,
        action: `ach_transfer_${action}`,
        entityType: 'ach_transfer',
        entityId: transferId,
        metadata: { amount: transfer.amount, action, comments },
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || ''
      });
      
    } catch (error) {
      console.error("ACH approval error:", error);
      res.status(500).json({ message: "Failed to process approval" });
    }
  });

  // Get ACH transfer status
  app.get("/api/ach/transfers/:transferId/status", isAuthenticated, async (req: any, res) => {
    try {
      const { transferId } = req.params;
      const userId = req.user.claims.sub;
      const user = await enhancedStorage.getUser(userId);
      
      if (!user?.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      const transactions = await enhancedStorage.getEnhancedTransactions(user.organizationId);
      const transfer = transactions.find((t: any) => t.id === transferId);
      
      if (!transfer) {
        return res.status(404).json({ message: "Transfer not found" });
      }
      
      res.json({
        id: transfer.id,
        status: transfer.status,
        amount: transfer.amount,
        createdAt: transfer.createdAt,
        metadata: transfer.metadata
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transfer status" });
    }
  });

  // ========== CITIZEN ROUTES ==========
  
  // Public services listing
  app.get("/api/public/services", async (req, res) => {
    try {
      const services = [
        { id: 'tax-payment', name: 'Property Tax Payment', category: 'tax', description: 'Pay your property taxes online' },
        { id: 'utility-bill', name: 'Utility Bill Payment', category: 'utility', description: 'Pay water, electricity, and gas bills' },
        { id: 'permits', name: 'Permits & Licenses', category: 'permit', description: 'Apply for building permits and business licenses' },
        { id: 'court-fines', name: 'Court Fines & Fees', category: 'fine', description: 'Pay traffic tickets and court fees' },
        { id: 'parking', name: 'Parking Permits', category: 'permit', description: 'Purchase monthly or annual parking permits' },
      ];
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch public services" });
    }
  });

  // Citizen payment processing
  app.post("/api/citizen/payment", async (req: any, res) => {
    try {
      const { serviceType, amount, citizenInfo, paymentMethod } = req.body;
      
      // Create citizen service record
      const service = await enhancedStorage.createCitizenService({
        organizationId: 'public', // Default public org
        serviceName: serviceType,
        serviceType: serviceType,
        citizenIdentifier: citizenInfo.accountNumber || citizenInfo.email,
        citizenName: citizenInfo.name,
        citizenEmail: citizenInfo.email,
        citizenPhone: citizenInfo.phone,
        amount: amount.toString(),
        paymentStatus: 'pending',
        paymentMethod,
      });

      // Process payment through selected provider
      const provider = serviceRegistry.getService('public', 'payment', paymentMethod);
      if (provider && provider.processPayment) {
        const result = await provider.processPayment(amount, 'USD', {
          serviceId: service.id,
          citizenEmail: citizenInfo.email
        });

        if (result.success) {
          await enhancedStorage.updateCitizenService(service.id, {
            paymentStatus: 'completed',
            transactionId: result.transactionId
          });
        }

        res.json({ success: result.success, serviceId: service.id, transactionId: result.transactionId });
      } else {
        res.status(400).json({ message: "Payment provider not available" });
      }
    } catch (error) {
      console.error("Citizen payment error:", error);
      res.status(500).json({ message: "Payment processing failed" });
    }
  });

  // Check payment status
  app.get("/api/citizen/payment/:serviceId", async (req, res) => {
    try {
      const services = await enhancedStorage.getCitizenServices('public');
      const service = services.find(s => s.id === req.params.serviceId);
      
      if (!service) {
        return res.status(404).json({ message: "Service record not found" });
      }
      
      res.json(service);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payment status" });
    }
  });

  // ========== VENDOR ROUTES ==========
  
  // Vendor registration
  app.post("/api/vendor/register", async (req, res) => {
    try {
      const vendorData = req.body;
      
      // Perform compliance screening
      const complianceService = serviceRegistry.getService('public', 'compliance', 'thomson_reuters');
      if (complianceService) {
        const screening = await complianceService.verifyBusiness(vendorData);
        
        if (!screening.approved) {
          return res.status(400).json({ message: "Vendor failed compliance screening", details: screening });
        }
      }
      
      // Create vendor record
      const vendor = await enhancedStorage.createVendor({
        ...vendorData,
        organizationId: 'public',
        status: 'pending_approval'
      });
      
      res.json({ success: true, vendorId: vendor.id, status: vendor.status });
    } catch (error) {
      console.error("Vendor registration error:", error);
      res.status(500).json({ message: "Vendor registration failed" });
    }
  });

  // Get open procurements (public)
  app.get("/api/vendor/procurements", async (req, res) => {
    try {
      const procurements = await enhancedStorage.getOpenProcurements('public');
      res.json(procurements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch procurements" });
    }
  });

  // Submit bid
  app.post("/api/vendor/bid", isAuthenticated, async (req: any, res) => {
    try {
      const { procurementId, bidAmount, proposal } = req.body;
      
      // Create bid record (simplified - would be more complex)
      const procurement = await enhancedStorage.getProcurement(procurementId);
      if (!procurement) {
        return res.status(404).json({ message: "Procurement not found" });
      }
      
      // Process bid submission
      const eProcurement = serviceRegistry.getService('public', 'specialized', 'eprocurement');
      const bidResult = await eProcurement.manageBidding(procurementId, {
        vendorId: req.user.claims.sub,
        bidAmount,
        proposal
      });
      
      res.json({ success: true, bidStatus: bidResult });
    } catch (error) {
      console.error("Bid submission error:", error);
      res.status(500).json({ message: "Bid submission failed" });
    }
  });

  // ========== CARD MANAGEMENT ROUTES ==========
  
  // Get all issued cards (admin)
  app.get("/api/cards", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await enhancedStorage.getUser(userId);
      
      if (!user?.organizationId || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const cards = await enhancedStorage.getIssuedCards(user.organizationId);
      res.json(cards || []);
    } catch (error) {
      console.error("Cards fetch error:", error);
      res.status(500).json({ message: "Failed to fetch cards" });
    }
  });
  
  // Issue new card
  app.post("/api/cards/issue", isAuthenticated, async (req: any, res) => {
    try {
      const { holderName, holderId, cardType, spendingLimit, monthlyLimit } = req.body;
      const userId = req.user.claims.sub;
      const user = await enhancedStorage.getUser(userId);
      
      if (!user?.organizationId || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Issue card through Stripe provider
      const provider = serviceRegistry.getService(user.organizationId, 'payment', 'stripe');
      if (provider && provider.issueCard) {
        const limits = { monthly: monthlyLimit || spendingLimit };
        const cardResult = await provider.issueCard(holderName, cardType, limits);
        
        if (cardResult.success) {
          // Store card in database
          const card = await enhancedStorage.createIssuedCard({
            cardNumber: cardResult.cardNumber || 'TEMP',
            cardType,
            holderName,
            holderId: holderId || userId,
            organizationId: user.organizationId,
            provider: 'stripe',
            externalCardId: cardResult.cardId,
            spendingLimit: spendingLimit?.toString(),
            monthlyLimit: monthlyLimit?.toString(),
            expiryDate: cardResult.expiryDate,
            status: (cardResult.status as any) || 'active'
          });
          
          res.json({ ...cardResult, id: card.id });
        } else {
          res.status(400).json({ message: cardResult.error });
        }
      } else {
        res.status(400).json({ message: "Card issuance not available" });
      }
    } catch (error) {
      console.error("Card issuance error:", error);
      res.status(500).json({ message: "Failed to issue card" });
    }
  });
  
  // Freeze/Unfreeze card
  app.patch("/api/cards/:cardId/:action", isAuthenticated, async (req: any, res) => {
    try {
      const { cardId, action } = req.params;
      const userId = req.user.claims.sub;
      const user = await enhancedStorage.getUser(userId);
      
      if (!user?.organizationId || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      if (action !== 'freeze' && action !== 'unfreeze') {
        return res.status(400).json({ message: "Invalid action" });
      }
      
      // Update card status (use blocked for freeze, active for unfreeze)
      await enhancedStorage.updateIssuedCard(cardId, {
        status: action === 'freeze' ? 'blocked' : 'active'
      });
      res.json({ success: true, message: `Card ${action}d successfully` });
    } catch (error) {
      console.error("Card status update error:", error);
      res.status(500).json({ message: "Failed to update card status" });
    }
  });

  // ========== DIRECT DEPOSIT ROUTES ==========
  
  // Get direct deposit transfers (using enhanced transactions)
  app.get("/api/direct-deposits", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await enhancedStorage.getUser(userId);
      
      if (!user?.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      // Get ACH transactions which include direct deposits
      const transfers = await enhancedStorage.getEnhancedTransactions(user.organizationId);
      const achTransfers = transfers.filter((t: any) => t.paymentType === 'ach');
      
      res.json(achTransfers || []);
    } catch (error) {
      console.error("Direct deposits fetch error:", error);
      res.status(500).json({ message: "Failed to fetch direct deposits" });
    }
  });
  
  // Process ACH transfer
  app.post("/api/direct-deposits/transfer", isAuthenticated, async (req: any, res) => {
    try {
      const transferData = req.body;
      const userId = req.user.claims.sub;
      const user = await enhancedStorage.getUser(userId);
      
      if (!user?.organizationId || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Process through provider
      const provider = serviceRegistry.getService(user.organizationId, 'payment', 'stripe');
      if (provider && provider.processACH) {
        const result = await provider.processACH(
          transferData.amount,
          'main-account', // From account
          transferData.recipientAccount,
          transferData.transferSpeed
        );
        
        if (result.success) {
          // Store transfer record using enhanced transactions
          await enhancedStorage.createEnhancedTransaction({
            organizationId: user.organizationId,
            paymentType: 'ach',
            type: 'debit',
            provider: 'stripe',
            amount: transferData.amount.toString(),
            currency: 'USD',
            status: 'completed',
            providerTransactionId: result.transferId,
            description: transferData.description || 'Direct deposit transfer',
            metadata: {
              estimatedSettlement: result.estimatedSettlement,
              fees: result.fees,
              recipientAccount: transferData.recipientAccount
            }
          });
          
          res.json(result);
        } else {
          res.status(400).json({ message: result.error });
        }
      } else {
        res.status(400).json({ message: "ACH transfers not available" });
      }
    } catch (error) {
      console.error("ACH transfer error:", error);
      res.status(500).json({ message: "Failed to process ACH transfer" });
    }
  });
  
  // Employee direct deposit enrollment (simplified - using bank accounts)
  app.get("/api/direct-deposit/enrollment", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await enhancedStorage.getUser(userId);
      
      if (!user?.organizationId) {
        return res.json({ isEnrolled: false });
      }
      
      // Check if user has verified bank accounts
      const accounts = await enhancedStorage.getVerifiedBankAccounts(user.organizationId);
      const hasEnrollment = accounts.length > 0;
      
      res.json({ isEnrolled: hasEnrollment, accounts });
    } catch (error) {
      console.error("Enrollment fetch error:", error);
      res.status(500).json({ message: "Failed to fetch enrollment status" });
    }
  });
  
  // Enroll in direct deposit (create bank account)
  app.post("/api/direct-deposit/enroll", isAuthenticated, async (req: any, res) => {
    try {
      const { accountNumber, routingNumber, accountName, bankName, accountType } = req.body;
      const userId = req.user.claims.sub;
      const user = await enhancedStorage.getUser(userId);
      
      if (!user?.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      // Validate account number format (basic validation)
      if (!accountNumber || accountNumber.length < 4 || accountNumber.length > 17) {
        return res.status(400).json({ message: "Invalid account number format" });
      }
      
      // Validate routing number (US format)
      if (!routingNumber || !/^\d{9}$/.test(routingNumber)) {
        return res.status(400).json({ message: "Invalid routing number format" });
      }
      
      // TODO: In production, encrypt the account number before storage
      // Example: const encryptedAccountNumber = await encryptSensitiveData(accountNumber);
      
      // Create bank account for direct deposit
      const account = await enhancedStorage.createBankAccount({
        organizationId: user.organizationId,
        accountName: accountName || `${user.firstName} ${user.lastName} Direct Deposit`,
        accountNumber, // TODO: Should be encrypted in production with proper key management
        routingNumber,
        bankName,
        accountType,
        isVerified: false,
        isActive: true
      });
      
      res.json({ success: true, message: "Direct deposit enrollment successful", accountId: account.id });
    } catch (error) {
      console.error("Enrollment error:", error);
      res.status(500).json({ message: "Failed to enroll in direct deposit" });
    }
  });

  // ========== PAYMENT HUB ROUTES ==========
  
  // Get payment providers status
  app.get("/api/payment-providers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await enhancedStorage.getUser(userId);
      
      const providers = [
        { name: 'stripe', status: 'active', methods: ['ach', 'wire', 'card'] },
        { name: 'paypal', status: 'active', methods: ['instant', 'card'] },
        { name: 'dwolla', status: 'active', methods: ['ach'] },
        { name: 'wise', status: 'inactive', methods: ['wire', 'international'] },
        { name: 'square', status: 'inactive', methods: ['card', 'ach'] },
      ];
      
      res.json(providers);
    } catch (error) {
      console.error("Providers fetch error:", error);
      res.status(500).json({ message: "Failed to fetch providers" });
    }
  });
  
  // Get all payments
  app.get("/api/payments/all", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await enhancedStorage.getUser(userId);
      
      if (!user?.organizationId || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const payments = await enhancedStorage.getPayments(user.organizationId);
      res.json(payments || []);
    } catch (error) {
      console.error("Payments fetch error:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });
  
  // Process unified payment
  app.post("/api/payments/process", isAuthenticated, async (req: any, res) => {
    try {
      const paymentData = req.body;
      const userId = req.user.claims.sub;
      const user = await enhancedStorage.getUser(userId);
      
      if (!user?.organizationId || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Process through selected provider
      const provider = serviceRegistry.getService(
        user.organizationId, 
        'payment', 
        paymentData.provider
      );
      
      if (!provider) {
        return res.status(400).json({ message: "Payment provider not available" });
      }
      
      let result;
      
      // Route to appropriate payment method
      if (paymentData.paymentMethod === 'ach') {
        result = await provider.processACH?.(
          paymentData.amount,
          'main-account',
          paymentData.recipientAccount,
          'standard'
        );
      } else if (paymentData.paymentMethod === 'wire') {
        result = await provider.processWire?.(
          paymentData.amount,
          'main-account',
          paymentData.recipientAccount,
          paymentData.currency === 'USD' ? 'domestic' : 'international'
        );
      } else {
        result = await provider.processPayment?.(
          paymentData.amount,
          paymentData.currency,
          paymentData
        );
      }
      
      if (result?.success) {
        // Store payment record using existing payment schema
        await enhancedStorage.createPayment({
          organizationId: user.organizationId,
          amount: paymentData.amount.toString(),
          description: paymentData.description || 'Payment',
          type: paymentData.paymentMethod as any,
          status: 'completed',
          createdBy: userId
        });
        
        res.json(result);
      } else {
        res.status(400).json({ message: result?.error || "Payment failed" });
      }
    } catch (error) {
      console.error("Payment processing error:", error);
      res.status(500).json({ message: "Failed to process payment" });
    }
  });
  
  // Schedule payment (using existing payment schema with future date)
  app.post("/api/payments/schedule", isAuthenticated, async (req: any, res) => {
    try {
      const scheduleData = req.body;
      const userId = req.user.claims.sub;
      const user = await enhancedStorage.getUser(userId);
      
      if (!user?.organizationId || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Save scheduled payment using regular payment with pending status
      await enhancedStorage.createPayment({
        organizationId: user.organizationId,
        amount: scheduleData.amount.toString(),
        description: scheduleData.description || 'Scheduled payment',
        type: scheduleData.paymentMethod as any,
        status: 'pending',
        dueDate: new Date(scheduleData.scheduledDate),
        createdBy: userId
      });
      
      res.json({ success: true, message: "Payment scheduled successfully" });
    } catch (error) {
      console.error("Schedule payment error:", error);
      res.status(500).json({ message: "Failed to schedule payment" });
    }
  });
  
  // Get scheduled payments (pending payments with future due dates)
  app.get("/api/payments/scheduled", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await enhancedStorage.getUser(userId);
      
      if (!user?.organizationId || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Get pending payments with future due dates
      const scheduled = await enhancedStorage.getPendingPayments(user.organizationId);
      res.json(scheduled || []);
    } catch (error) {
      console.error("Scheduled payments fetch error:", error);
      res.status(500).json({ message: "Failed to fetch scheduled payments" });
    }
  });

  // ========== EMPLOYEE ROUTES ==========
  
  // Check if user is verified employee
  app.get("/api/employee/verification-status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const employee = await employeeVerificationService.getEmployeeByUserId(userId);
      
      res.json({
        isVerified: employee?.isVerified || false,
        employee: employee || null,
        requiresVerification: !employee || !employee.isVerified
      });
    } catch (error) {
      console.error("Verification status error:", error);
      res.status(500).json({ message: "Failed to check verification status" });
    }
  });
  
  // Verify employee identity
  app.post("/api/employee/verify", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { employeeId, lastName, dateOfBirth } = req.body;
      
      if (!employeeId || !lastName || !dateOfBirth) {
        return res.status(400).json({ message: "Missing required verification fields" });
      }
      
      const result = await employeeVerificationService.verifyEmployee(
        userId, 
        employeeId, 
        lastName, 
        dateOfBirth
      );
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Employee verification error:", error);
      res.status(500).json({ message: "Failed to verify employee" });
    }
  });
  
  // Employee dashboard data (requires verification)
  app.get("/api/employee/dashboard", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const employee = await employeeVerificationService.getVerifiedEmployee(userId);
      
      // Require verification
      if (!employee) {
        return res.json({
          cards: [],
          expenses: [],
          managedGrants: [],
          organization: null,
          requiresVerification: true,
          message: "Please verify your employee information to access the dashboard."
        });
      }
      
      // Get employee-specific data
      const cards = await enhancedStorage.getCardsByHolder(userId);
      const expenses = await enhancedStorage.getExpenses(employee.organizationId);
      const userExpenses = expenses.filter(e => e.submittedBy === userId);
      const grants = await enhancedStorage.getGrantsByManager(userId);
      
      res.json({
        cards,
        expenses: userExpenses,
        managedGrants: grants,
        organization: await enhancedStorage.getOrganization(employee.organizationId),
        employee,
        requiresVerification: false
      });
    } catch (error) {
      console.error("Employee dashboard error:", error);
      res.status(500).json({ message: "Failed to fetch employee dashboard" });
    }
  });

  // Request card issuance
  app.post("/api/employee/card/request", isAuthenticated, async (req: any, res) => {
    try {
      const { cardType, spendingLimit, justification } = req.body;
      const userId = req.user.claims.sub;
      const user = await enhancedStorage.getUser(userId);
      
      if (!user?.organizationId) {
        return res.status(400).json({ message: "Employee not associated with organization" });
      }
      
      // Issue card through provider
      const provider = serviceRegistry.getService(user.organizationId, 'payment', 'stripe');
      if (provider && provider.issueCard) {
        const cardResult = await provider.issueCard(
          `${user.firstName} ${user.lastName}`,
          cardType,
          { monthly: spendingLimit }
        );
        
        if (cardResult.success) {
          // Save card record
          const card = await enhancedStorage.createIssuedCard({
            cardNumber: cardResult.cardNumber!,
            cardType: cardType as any,
            holderName: `${user.firstName} ${user.lastName}`,
            holderId: userId,
            organizationId: user.organizationId,
            provider: 'stripe',
            externalCardId: cardResult.cardId,
            monthlyLimit: spendingLimit.toString(),
            status: 'pending'
          });
          
          res.json({ success: true, cardId: card.id });
        } else {
          res.status(400).json({ message: cardResult.error });
        }
      } else {
        res.status(400).json({ message: "Card issuance not available" });
      }
    } catch (error) {
      console.error("Card request error:", error);
      res.status(500).json({ message: "Card request failed" });
    }
  });

  // ========== ADMINISTRATOR ROUTES ==========
  
  // Upload employees CSV
  app.post("/api/admin/employees/upload", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await enhancedStorage.getUser(userId);
      
      // Check admin role
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      if (!user?.organizationId) {
        return res.status(400).json({ message: "Admin must be associated with an organization" });
      }
      
      const { csvData } = req.body;
      if (!csvData) {
        return res.status(400).json({ message: "CSV data is required" });
      }
      
      const result = await employeeVerificationService.uploadEmployees(
        csvData,
        user.organizationId
      );
      
      res.json({
        message: `Successfully uploaded ${result.success} employees`,
        success: result.success,
        errors: result.errors
      });
    } catch (error: any) {
      console.error("Employee upload error:", error);
      res.status(500).json({ message: error?.message || "Failed to upload employees" });
    }
  });
  
  // Get all employees for admin (using employee verification service)
  app.get("/api/admin/employees", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await enhancedStorage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      if (!user?.organizationId) {
        return res.status(400).json({ message: "Admin must be associated with an organization" });
      }
      
      // Get employees from employee verification service
      const employees = await employeeVerificationService.getEmployeesByOrganization(user.organizationId);
      res.json(employees);
    } catch (error) {
      console.error("Get employees error:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });
  
  // Get comprehensive analytics
  app.get("/api/admin/analytics", isAuthenticated, async (req: any, res) => {
    try {
      const user = await enhancedStorage.getUser(req.user.claims.sub);
      
      if (!user?.organizationId || user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const analytics = await enhancedStorage.getComprehensiveAnalytics(user.organizationId);
      const providerStats = await enhancedStorage.getProviderAnalytics(user.organizationId);
      const complianceStats = await enhancedStorage.getComplianceAnalytics(user.organizationId);
      const grantStats = await enhancedStorage.getGrantAnalytics(user.organizationId);
      
      res.json({
        overview: analytics,
        providers: providerStats,
        compliance: complianceStats,
        grants: grantStats
      });
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Configure payment provider
  app.post("/api/admin/providers", isAuthenticated, async (req: any, res) => {
    try {
      const user = await enhancedStorage.getUser(req.user.claims.sub);
      
      if (!user?.organizationId || user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const validatedData = insertPaymentProviderSchema.parse({
        ...req.body,
        organizationId: user.organizationId
      });
      
      // Register with service registry
      await serviceRegistry.registerService({
        organizationId: user.organizationId,
        serviceType: 'payment',
        provider: validatedData.provider,
        configuration: validatedData.configuration as any,
        isActive: validatedData.isActive || true
      });
      
      // Save to database
      const provider = await enhancedStorage.createPaymentProvider(validatedData);
      
      res.json({ success: true, provider });
    } catch (error) {
      console.error("Provider configuration error:", error);
      res.status(500).json({ message: "Failed to configure provider" });
    }
  });

  // Configure integration
  app.post("/api/admin/integrations", isAuthenticated, async (req: any, res) => {
    try {
      const user = await enhancedStorage.getUser(req.user.claims.sub);
      
      if (!user?.organizationId || user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const validatedData = insertIntegrationSchema.parse({
        ...req.body,
        organizationId: user.organizationId
      });
      
      // Register with service registry
      await serviceRegistry.registerService({
        organizationId: user.organizationId,
        serviceType: validatedData.type as string,
        provider: validatedData.provider,
        configuration: validatedData.configuration as any,
        isActive: true
      });
      
      // Save to database
      const integration = await enhancedStorage.createIntegration(validatedData);
      
      res.json({ success: true, integration });
    } catch (error) {
      console.error("Integration configuration error:", error);
      res.status(500).json({ message: "Failed to configure integration" });
    }
  });

  // System health check
  app.get("/api/admin/health", isAuthenticated, async (req: any, res) => {
    try {
      const user = await enhancedStorage.getUser(req.user.claims.sub);
      
      if (!user?.organizationId || user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const health = await serviceRegistry.healthCheck(user.organizationId);
      res.json(health);
    } catch (error) {
      console.error("Health check error:", error);
      res.status(500).json({ message: "Health check failed" });
    }
  });

  // ========== COMPLIANCE ROUTES ==========
  
  // Screen entity
  app.post("/api/compliance/screen", isAuthenticated, async (req: any, res) => {
    try {
      const { entityType, entityId, entityData } = req.body;
      const user = await enhancedStorage.getUser(req.user.claims.sub);
      
      if (!user?.organizationId) {
        return res.status(400).json({ message: "Organization not found" });
      }
      
      // Run multiple compliance checks
      const providers = ['thomson_reuters', 'lexisnexis', 'verafin', 'ofac'];
      const results = [];
      
      for (const providerName of providers) {
        const provider = serviceRegistry.getService(user.organizationId, 'compliance', providerName);
        if (provider && provider.screenEntity) {
          const result = await provider.screenEntity(entityType, entityData);
          results.push({ provider: providerName, result });
        }
      }
      
      // Calculate aggregate risk score
      const avgRiskScore = results.reduce((sum, r) => sum + (r.result.riskScore || 0), 0) / results.length;
      const requiresReview = avgRiskScore > 5;
      const approved = avgRiskScore <= 7 && !results.some(r => !r.result.approved);
      
      // Save compliance record
      const record = await enhancedStorage.createComplianceRecord({
        entityType,
        entityId,
        organizationId: user.organizationId,
        screeningType: 'comprehensive',
        status: requiresReview ? 'pending_review' : (approved ? 'compliant' : 'non_compliant'),
        provider: 'multi_provider',
        results: results as any,
        riskScore: Math.round(avgRiskScore),
        flags: results.flatMap(r => r.result.flags || [])
      });
      
      res.json({
        success: true,
        recordId: record.id,
        approved,
        riskScore: avgRiskScore,
        requiresReview,
        results
      });
    } catch (error) {
      console.error("Compliance screening error:", error);
      res.status(500).json({ message: "Compliance screening failed" });
    }
  });

  // ========== AUDIT ROUTES ==========
  
  // Get audit trail
  app.get("/api/audit/trail/:entityType/:entityId", isAuthenticated, async (req: any, res) => {
    try {
      const { entityType, entityId } = req.params;
      const logs = await enhancedStorage.getAuditLogsByEntity(entityType, entityId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch audit trail" });
    }
  });

  // Log audit event
  app.post("/api/audit/log", isAuthenticated, async (req: any, res) => {
    try {
      const user = await enhancedStorage.getUser(req.user.claims.sub);
      
      if (!user?.organizationId) {
        return res.status(400).json({ message: "Organization not found" });
      }
      
      const log = await enhancedStorage.createAuditLog({
        ...req.body,
        organizationId: user.organizationId,
        userId: req.user.claims.sub,
        ipAddress: req.ip
      });
      
      res.json({ success: true, logId: log.id });
    } catch (error) {
      res.status(500).json({ message: "Failed to create audit log" });
    }
  });

  // ========== GRANT ROUTES ==========
  
  // Create grant application
  app.post("/api/grants", isAuthenticated, async (req: any, res) => {
    try {
      const user = await enhancedStorage.getUser(req.user.claims.sub);
      
      if (!user?.organizationId) {
        return res.status(400).json({ message: "Organization not found" });
      }
      
      const validatedData = insertGrantSchema.parse({
        ...req.body,
        organizationId: user.organizationId,
        managedBy: req.user.claims.sub
      });
      
      const grant = await enhancedStorage.createGrant(validatedData);
      res.json(grant);
    } catch (error) {
      console.error("Grant creation error:", error);
      res.status(500).json({ message: "Failed to create grant" });
    }
  });

  // Get active grants
  app.get("/api/grants/active", isAuthenticated, async (req: any, res) => {
    try {
      const user = await enhancedStorage.getUser(req.user.claims.sub);
      
      if (!user?.organizationId) {
        return res.status(400).json({ message: "Organization not found" });
      }
      
      const grants = await enhancedStorage.getActiveGrants(user.organizationId);
      res.json(grants);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active grants" });
    }
  });

  // ========== ASSET ROUTES ==========
  
  // Get assets
  app.get("/api/assets", isAuthenticated, async (req: any, res) => {
    try {
      const user = await enhancedStorage.getUser(req.user.claims.sub);
      
      if (!user?.organizationId) {
        return res.status(400).json({ message: "Organization not found" });
      }
      
      const { category } = req.query;
      const assets = category 
        ? await enhancedStorage.getAssetsByCategory(user.organizationId, category as string)
        : await enhancedStorage.getAssets(user.organizationId);
      
      res.json(assets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assets" });
    }
  });

  // Schedule maintenance
  app.post("/api/assets/maintenance", isAuthenticated, async (req: any, res) => {
    try {
      const { assetIds, maintenanceType } = req.body;
      
      // Use asset management service
      const assetService = serviceRegistry.getService('public', 'specialized', 'asset_management');
      const schedule = await assetService.scheduleMaintenance(assetIds, maintenanceType);
      
      res.json({ success: true, schedule });
    } catch (error) {
      console.error("Maintenance scheduling error:", error);
      res.status(500).json({ message: "Failed to schedule maintenance" });
    }
  });

  // ========== PROCUREMENT ROUTES ==========
  
  // Create RFP
  app.post("/api/procurement/rfp", isAuthenticated, async (req: any, res) => {
    try {
      const user = await enhancedStorage.getUser(req.user.claims.sub);
      
      if (!user?.organizationId) {
        return res.status(400).json({ message: "Organization not found" });
      }
      
      const validatedData = insertProcurementSchema.parse({
        ...req.body,
        organizationId: user.organizationId,
        managedBy: req.user.claims.sub,
        procurementNumber: `RFP-${Date.now()}`
      });
      
      const procurement = await enhancedStorage.createProcurement(validatedData);
      
      // Create RFP through e-procurement service
      const eProcurement = serviceRegistry.getService('public', 'specialized', 'eprocurement');
      const rfp = await eProcurement.createRFP(procurement);
      
      res.json({ success: true, procurement, rfp });
    } catch (error) {
      console.error("RFP creation error:", error);
      res.status(500).json({ message: "Failed to create RFP" });
    }
  });

  // ========== TREASURY ROUTES ==========
  
  // Cash flow forecasting
  app.get("/api/treasury/cashflow", isAuthenticated, async (req: any, res) => {
    try {
      const user = await enhancedStorage.getUser(req.user.claims.sub);
      
      if (!user?.organizationId) {
        return res.status(400).json({ message: "Organization not found" });
      }
      
      // Get historical transaction data
      const transactions = await enhancedStorage.getEnhancedTransactions(user.organizationId);
      
      // Use treasury management service
      const treasuryService = serviceRegistry.getService('public', 'treasury', 'treasury_management');
      const forecast = await treasuryService.cashFlowForecasting(transactions);
      
      res.json(forecast);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate cash flow forecast" });
    }
  });

  // ========== UTILITY & TAX ROUTES ==========
  
  // Process utility payment
  app.post("/api/utility/payment", async (req, res) => {
    try {
      const { accountNumber, amount, utilityType } = req.body;
      
      const utilityService = serviceRegistry.getService('public', 'specialized', 'utility_billing');
      const payment = await utilityService.processUtilityPayments({
        accountNumber,
        paymentAmount: amount,
        utilityType
      });
      
      res.json(payment);
    } catch (error) {
      console.error("Utility payment error:", error);
      res.status(500).json({ message: "Utility payment failed" });
    }
  });

  // Process property tax payment
  app.post("/api/tax/property", async (req, res) => {
    try {
      const { parcelNumber, amount, taxYear } = req.body;
      
      const taxService = serviceRegistry.getService('public', 'specialized', 'property_tax');
      const payment = await taxService.processPayments({
        parcelNumber,
        paymentAmount: amount,
        taxYear
      });
      
      res.json(payment);
    } catch (error) {
      console.error("Property tax payment error:", error);
      res.status(500).json({ message: "Property tax payment failed" });
    }
  });

  // ========== COURT SYSTEM ROUTES ==========
  
  // Process court fine payment
  app.post("/api/court/fine", async (req, res) => {
    try {
      const { caseNumber, amount, fineType } = req.body;
      
      const courtService = serviceRegistry.getService('public', 'specialized', 'court_system');
      const payment = await courtService.processFines({
        caseNumber,
        amount,
        fineType
      });
      
      res.json(payment);
    } catch (error) {
      console.error("Court fine payment error:", error);
      res.status(500).json({ message: "Court fine payment failed" });
    }
  });

  // ========== REPORTING ROUTES ==========
  
  // Generate comprehensive report
  app.post("/api/reports/generate", isAuthenticated, async (req: any, res) => {
    try {
      const { reportType, period, format } = req.body;
      const user = await enhancedStorage.getUser(req.user.claims.sub);
      
      if (!user?.organizationId) {
        return res.status(400).json({ message: "Organization not found" });
      }
      
      // Use appropriate reporting service based on type
      let report;
      switch (reportType) {
        case 'gasb':
          const workiva = serviceRegistry.getService(user.organizationId, 'audit', 'workiva');
          report = await workiva.generateGASBReport({ period, organizationId: user.organizationId });
          break;
        case 'audit':
          const datasnipper = serviceRegistry.getService(user.organizationId, 'audit', 'datasnipper');
          report = await datasnipper.generateAuditReport(`audit_${Date.now()}`);
          break;
        case 'financial':
          const quickbooks = serviceRegistry.getService(user.organizationId, 'government', 'quickbooks');
          report = await quickbooks.getFinancialReports('comprehensive', period);
          break;
        default:
          report = { type: reportType, period, data: 'Report data placeholder' };
      }
      
      res.json({ success: true, report });
    } catch (error) {
      console.error("Report generation error:", error);
      res.status(500).json({ message: "Report generation failed" });
    }
  });
}