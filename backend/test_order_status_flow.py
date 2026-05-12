"""
End-to-end regression check for admin order status updates.
Run: python test_order_status_flow.py
"""
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import SessionLocal
from app.models.order import Order
from app.models.user import User
from app.services.auth import create_access_token


def test_admin_updates_order_status_and_user_sees_it() -> bool:
    with SessionLocal() as db:
        admin = db.query(User).filter(User.role == 'admin').first()
        if not admin:
            print('❌ No admin user found in the database.')
            return False

        user = (
            db.query(User)
            .join(Order)
            .filter(User.role != 'admin')
            .first()
        )
        if not user:
            print('❌ No non-admin user with an order found in the database.')
            return False

        order = db.query(Order).filter(Order.user_id == user.id).first()
        if not order:
            print(f'❌ No orders found for user id={user.id}.')
            return False

    admin_token = create_access_token(subject=str(admin.id))
    user_token = create_access_token(subject=str(user.id))

    with TestClient(app) as client:
        admin_headers = {'Authorization': f'Bearer {admin_token}'}
        user_headers = {'Authorization': f'Bearer {user_token}'}

        response = client.put(
            f'/admin/orders/{order.id}/status',
            headers=admin_headers,
            json={'status': 'delivered'},
        )

        if response.status_code != 200:
            print('❌ Admin status update failed.')
            print(f'Status code: {response.status_code}')
            print(f'Response: {response.text}')
            return False

        payload = response.json()
        if payload.get('status') != 'delivered':
            print('❌ Admin response did not return delivered status.')
            print(f'Response payload: {payload}')
            return False

        print(f'✅ Admin updated order {order.id} status to delivered.')

        orders_response = client.get('/orders', headers=user_headers)
        if orders_response.status_code != 200:
            print('❌ Failed to fetch user orders.')
            print(f'Status code: {orders_response.status_code}')
            print(f'Response: {orders_response.text}')
            return False

        orders_json = orders_response.json()
        orders = orders_json.get('orders', [])
        matching_order = next((o for o in orders if o.get('id') == order.id), None)

        if not matching_order:
            print('❌ Updated order was not returned in user orders.')
            print(f'Response payload: {orders_json}')
            return False

        if matching_order.get('status') != 'delivered':
            print('❌ User API still shows a different status for the updated order.')
            print(f'Order payload: {matching_order}')
            return False

        print('✅ User /orders returned the updated order with status delivered.')
        return True


if __name__ == '__main__':
    result = test_admin_updates_order_status_and_user_sees_it()
    if result:
        print('\nAll checks passed.')
    else:
        print('\nOne or more checks failed.')
