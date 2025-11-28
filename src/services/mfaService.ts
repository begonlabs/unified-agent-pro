import { supabase } from '@/integrations/supabase/client';

interface EnrollMFAResult {
    id: string;
    qr_code: string;
    secret: string;
    uri: string;
}

interface MFAFactor {
    id: string;
    friendly_name: string;
    factor_type: 'totp';
    status: 'verified' | 'unverified';
    created_at: string;
    updated_at: string;
}

/**
 * Service for handling Multi-Factor Authentication (2FA) operations
 */
export class MFAService {
    /**
     * Initiate MFA enrollment process
     * Generates a QR code and secret for Google Authenticator
     */
    static async enrollMFA(): Promise<EnrollMFAResult> {
        const { data, error } = await supabase.auth.mfa.enroll({
            factorType: 'totp',
            friendlyName: 'OndAI Authenticator'
        });

        if (error) throw error;

        if (!data?.totp) {
            throw new Error('Failed to generate TOTP data');
        }

        return {
            id: data.id,
            qr_code: data.totp.qr_code,
            secret: data.totp.secret,
            uri: data.totp.uri
        };
    }

    /**
     * Verify TOTP code and enable MFA
     */
    static async verifyAndEnableMFA(factorId: string, code: string) {
        // Create a challenge
        const challenge = await supabase.auth.mfa.challenge({ factorId });

        if (challenge.error) throw challenge.error;

        if (!challenge.data) {
            throw new Error('Failed to create MFA challenge');
        }

        // Verify the code
        const verify = await supabase.auth.mfa.verify({
            factorId,
            challengeId: challenge.data.id,
            code
        });

        if (verify.error) throw verify.error;

        return verify.data;
    }

    /**
     * Get all active MFA factors for current user
     */
    static async getActiveMFAFactors(): Promise<MFAFactor[]> {
        const { data, error } = await supabase.auth.mfa.listFactors();

        if (error) throw error;

        return (data?.totp || []) as MFAFactor[];
    }

    /**
     * Disable MFA (unenroll)
     */
    static async unenrollMFA(factorId: string) {
        const { data, error } = await supabase.auth.mfa.unenroll({ factorId });

        if (error) throw error;

        // Delete all recovery codes when disabling MFA
        await this.deleteAllRecoveryCodes();

        return data;
    }

    /**
     * Generate recovery codes for backup authentication
     */
    static async generateRecoveryCodes(count: number = 10): Promise<string[]> {
        const codes: string[] = [];

        // Generate random alphanumeric codes
        for (let i = 0; i < count; i++) {
            const code = this.generateSecureCode(8);
            codes.push(code);
        }

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Save codes to database
        const { error } = await supabase
            .from('user_recovery_codes')
            .insert(
                codes.map(code => ({
                    user_id: user.id,
                    code: code
                }))
            );

        if (error) throw error;

        return codes;
    }

    /**
     * Get unused recovery codes for current user
     */
    static async getRecoveryCodes(): Promise<string[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('user_recovery_codes')
            .select('code')
            .eq('user_id', user.id)
            .eq('used', false)
            .order('created_at', { ascending: true });

        if (error) throw error;

        return data?.map(item => item.code) || [];
    }

    /**
     * Verify a recovery code
     */
    static async verifyRecoveryCode(code: string): Promise<boolean> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { data, error } = await supabase
            .from('user_recovery_codes')
            .select('*')
            .eq('user_id', user.id)
            .eq('code', code.toUpperCase())
            .eq('used', false)
            .maybeSingle();

        if (error || !data) return false;

        // Mark code as used
        const { error: updateError } = await supabase
            .from('user_recovery_codes')
            .update({
                used: true,
                used_at: new Date().toISOString()
            })
            .eq('id', data.id);

        if (updateError) {
            console.error('Error marking recovery code as used:', updateError);
            return false;
        }

        return true;
    }

    /**
     * Delete all recovery codes for current user
     */
    static async deleteAllRecoveryCodes(): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
            .from('user_recovery_codes')
            .delete()
            .eq('user_id', user.id);

        if (error) throw error;
    }

    /**
     * Generate a secure random code
     */
    private static generateSecureCode(length: number): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';

        // Use crypto.getRandomValues for secure random generation
        const randomValues = new Uint8Array(length);
        crypto.getRandomValues(randomValues);

        for (let i = 0; i < length; i++) {
            code += chars[randomValues[i] % chars.length];
        }

        return code;
    }

    /**
     * Check if user has MFA enabled
     */
    static async isMFAEnabled(): Promise<boolean> {
        try {
            const factors = await this.getActiveMFAFactors();
            return factors.some(factor => factor.status === 'verified');
        } catch (error) {
            console.error('Error checking MFA status:', error);
            return false;
        }
    }
}
