import {
  Body,
  Controller,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { AuthGuard, customExpressInterface } from 'src/users/users.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentService: PaymentsService) {}

  // this complete payment route will complete the payment of the user's booked seats through booked id
  @Post('/:bookingId')
  @UseGuards(AuthGuard)
  async completePayment(
    @Request() request: customExpressInterface,
    @Param() params: any,
    @Body() requestBody: any,
  ): Promise<{
    status: string;
    message: string;
    data: {
      paymentId: string;
    };
  }> {
    return this.paymentService.completePaymentService(request, {
      params,
      requestBody,
    });
  }
}
