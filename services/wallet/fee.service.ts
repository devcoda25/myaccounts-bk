import { Injectable } from '@nestjs/common';

@Injectable()
export class FeeService {
    calculateFee(amount: number, type: 'deposit' | 'withdrawal', method: string): number {
        // Centralized fee logic to replace frontend mocks

        let fee = 0;
        const absAmount = Math.abs(amount);

        if (type === 'deposit') {
            // Deposit fees
            switch (method) {
                case 'bank_transfer':
                    fee = 0; // Free
                    break;
                case 'card':
                    fee = Math.round(absAmount * 0.035) + 500; // 3.5% + 500 UGX
                    break;
                case 'mtn_momo':
                case 'airtel_money':
                    fee = Math.round(absAmount * 0.015); // 1.5%
                    break;
                default:
                    fee = 0;
            }
        } else {
            // Withdrawal fees
            switch (method) {
                case 'bank_transfer':
                    fee = Math.round(absAmount * 0.01) + 500; // 1% + 500
                    break;
                case 'mtn_momo':
                case 'airtel_money':
                    fee = Math.round(absAmount * 0.01); // 1%
                    if (fee < 500) fee = 500; // Min 500
                    break;
                default:
                    fee = 0;
            }
        }

        return fee;
    }
}
