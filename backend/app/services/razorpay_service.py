import hmac
import hashlib
from typing import Dict, Tuple
import razorpay
from pydantic import ValidationError


class RazorpayService:
    """Service for Razorpay payment integration with security best practices"""

    def __init__(self, key_id: str, key_secret: str):
        """Initialize Razorpay client with credentials from settings
        
        Args:
            key_id: Razorpay Key ID from environment
            key_secret: Razorpay Key Secret from environment
            
        Raises:
            ValueError: If credentials are missing or empty
        """
        if not key_id or not key_secret:
            raise ValueError(
                'Missing Razorpay credentials. '
                'Ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set in .env'
            )
        
        self.key_id = key_id
        self.key_secret = key_secret
        self.client = razorpay.Client(auth=(self.key_id, self.key_secret))

    def create_order(
        self,
        amount: int,
        currency: str = 'INR',
        receipt: str = None,
        notes: Dict = None
    ) -> Dict:
        """
        Create a Razorpay order
        
        Args:
            amount: Amount in paise (e.g., 50000 for ₹500)
            currency: Currency code (default: 'INR')
            receipt: Order receipt/reference ID
            notes: Additional order notes/metadata
            
        Returns:
            Dictionary containing order_id, amount, currency, receipt
            
        Raises:
            Exception: If order creation fails
        """
        try:
            # Validate amount
            if amount <= 0:
                raise ValueError('Amount must be greater than 0')
            
            # Prepare order data
            order_data = {
                'amount': amount,
                'currency': currency,
                'receipt': receipt or f'order_{receipt}',
                'notes': notes or {}
            }
            
            # Create order via Razorpay API
            response = self.client.order.create(data=order_data)
            
            return {
                'order_id': response['id'],
                'amount': response['amount'],
                'currency': response['currency'],
                'receipt': response['receipt'],
                'status': response['status']
            }
        except Exception as e:
            raise Exception(f'Failed to create Razorpay order: {str(e)}')

    def verify_signature(
        self,
        order_id: str,
        payment_id: str,
        signature: str
    ) -> Tuple[bool, str]:
        """
        Verify Razorpay payment signature
        
        Security: This verification ensures that:
        1. Payment is authentic (from Razorpay)
        2. Order ID and Payment ID are not tampered with
        3. Only backend with secret key can verify
        
        Args:
            order_id: Razorpay order ID
            payment_id: Razorpay payment ID
            signature: Payment signature from Razorpay
            
        Returns:
            Tuple of (is_valid: bool, message: str)
        """
        try:
            # Create verification data in the format: order_id|payment_id
            verify_data = f'{order_id}|{payment_id}'
            
            # Generate HMAC-SHA256 signature using secret key
            generated_signature = hmac.new(
                self.key_secret.encode(),
                verify_data.encode(),
                hashlib.sha256
            ).hexdigest()
            
            # Compare signatures using constant-time comparison
            # This prevents timing attacks
            is_valid = hmac.compare_digest(generated_signature, signature)
            
            if is_valid:
                return True, 'Payment signature verified successfully'
            else:
                return False, 'Invalid payment signature - payment may be tampered'
                
        except Exception as e:
            return False, f'Signature verification failed: {str(e)}'

    def fetch_payment_details(self, payment_id: str) -> Dict:
        """
        Fetch payment details from Razorpay
        
        Args:
            payment_id: Razorpay payment ID
            
        Returns:
            Dictionary containing payment details
            
        Raises:
            Exception: If payment fetch fails
        """
        try:
            payment = self.client.payment.fetch(payment_id)
            return {
                'id': payment['id'],
                'amount': payment['amount'],
                'currency': payment['currency'],
                'status': payment['status'],
                'method': payment.get('method'),
                'vpa': payment.get('vpa'),  # For UPI
                'email': payment.get('email'),
                'contact': payment.get('contact'),
                'created_at': payment['created_at']
            }
        except Exception as e:
            raise Exception(f'Failed to fetch payment details: {str(e)}')

    def fetch_order_details(self, order_id: str) -> Dict:
        """
        Fetch order details from Razorpay
        
        Args:
            order_id: Razorpay order ID
            
        Returns:
            Dictionary containing order details
            
        Raises:
            Exception: If order fetch fails
        """
        try:
            order = self.client.order.fetch(order_id)
            return {
                'id': order['id'],
                'amount': order['amount'],
                'currency': order['currency'],
                'status': order['status'],
                'receipt': order['receipt'],
                'created_at': order['created_at']
            }
        except Exception as e:
            raise Exception(f'Failed to fetch order details: {str(e)}')


# Singleton instance
_razorpay_service = None


def get_razorpay_service() -> RazorpayService:
    """Get or create Razorpay service instance with credentials from settings"""
    global _razorpay_service
    if _razorpay_service is None:
        from app.core.config import settings
        _razorpay_service = RazorpayService(
            key_id=settings.razorpay_key_id,
            key_secret=settings.razorpay_key_secret
        )
    return _razorpay_service
