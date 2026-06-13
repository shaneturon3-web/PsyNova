import { Body, Controller, Get, Headers, Logger, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthTokenGuard } from '../auth/guards/auth-token.guard';
import { BillingService } from './billing.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { ListInvoicesQueryDto } from './dto/list-invoices.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateClaimDto, ListClaimsQueryDto } from './dto/create-claim.dto';
import { QuoteDto } from './dto/quote.dto';
import { CreateCheckoutSessionDto } from './dto/checkout.dto';

type ReqUser = Request & { authUser?: { sub?: string; role?: string } };

@Controller('billing')
export class BillingController {
  private readonly logger = new Logger(BillingController.name);
  constructor(private readonly billing: BillingService) {}

  /**
   * Stripe webhook — uses the raw-body buffer attached by the rawBody middleware in main.ts.
   * Public (no AuthTokenGuard) by design; signature header is the auth.
   */
  @Post('stripe/webhook')
  async stripeWebhook(@Req() req: Request & { rawBody?: Buffer }, @Headers('stripe-signature') sig: string | undefined) {
    return this.billing.handleStripeWebhook(req.rawBody ?? Buffer.from(JSON.stringify((req as any).body ?? {})), sig);
  }

  @Get('quote')
  @UseGuards(AuthTokenGuard)
  quote(@Query() q: QuoteDto) { return this.billing.quote(q); }

  @Get('invoices')
  @UseGuards(AuthTokenGuard)
  list(@Query() q: ListInvoicesQueryDto) { return this.billing.listInvoices(q); }

  @Post('invoices')
  @UseGuards(AuthTokenGuard)
  create(@Body() dto: CreateInvoiceDto, @Req() req: ReqUser) {
    this.logger.log(`[billing.create] by=${req.authUser?.sub}`);
    return this.billing.createInvoice(dto, req.authUser?.sub);
  }

  @Get('invoices/:id')
  @UseGuards(AuthTokenGuard)
  findOne(@Param('id') id: string) { return this.billing.findOne(id); }

  @Post('invoices/:id/payments')
  @UseGuards(AuthTokenGuard)
  addPayment(@Param('id') id: string, @Body() dto: CreatePaymentDto, @Req() req: ReqUser) {
    return this.billing.addPayment(id, dto, req.authUser?.sub);
  }

  @Post('invoices/:id/checkout-session')
  @UseGuards(AuthTokenGuard)
  checkout(@Param('id') id: string, @Body() dto: CreateCheckoutSessionDto, @Req() req: ReqUser) {
    return this.billing.createCheckoutSession(id, dto, req.authUser?.sub);
  }

  @Get('invoices/:id/receipt.pdf')
  @UseGuards(AuthTokenGuard)
  async receipt(@Param('id') id: string, @Res() res: Response) {
    const pdf = await this.billing.receiptPdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="receipt-${id.slice(0, 8)}.pdf"`);
    res.send(pdf);
  }

  @Get('claims')
  @UseGuards(AuthTokenGuard)
  listClaims(@Query() q: ListClaimsQueryDto) { return this.billing.listClaims(q); }

  @Post('invoices/:id/claims')
  @UseGuards(AuthTokenGuard)
  createClaim(@Param('id') invoiceId: string, @Body() dto: CreateClaimDto, @Req() req: ReqUser) {
    return this.billing.createClaim(invoiceId, dto, req.authUser?.sub);
  }

  @Get('claims/:id')
  @UseGuards(AuthTokenGuard)
  findClaim(@Param('id') id: string) { return this.billing.findClaim(id); }
}
