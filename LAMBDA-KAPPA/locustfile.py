import random
import uuid
from locust import HttpUser, task, between, tag

class BigDataStreamProducerUser(HttpUser):
    """
    Nhóm User 1 (Trọng số 7): Mô phỏng các máy POS / Website đẩy đơn hàng liên tục
    và đối chiếu hiệu năng giữa Lambda Serving Merge vs Traditional Full-Scan.
    """
    weight = 7
    wait_time = between(0.05, 0.15) # Tần suất bắn sự kiện nhanh
    
    STORES = ["STORE_HCM_01", "STORE_HN_02", "STORE_DN_03", "STORE_CT_04"]
    CATEGORIES = ["Electronics", "Fashion", "HomeAppliances", "Books", "Beverages"]

    @tag('speed_layer', 'producer')
    @task(6)
    def produce_transaction_event(self):
        """
        [BEHAVIOR 1 - 60%]: Bắn sự kiện đơn hàng mới vào Ingestion API
        """
        payload = {
            "event_id": f"evt_{uuid.uuid4().hex[:8]}",
            "event_type": "ORDER_COMPLETED",
            "store_id": random.choice(self.STORES),
            "order_id": f"ORD-{random.randint(10000, 99999)}",
            "customer_id": f"CUST-{random.randint(100, 999)}",
            "category": random.choice(self.CATEGORIES),
            "amount": random.randint(1, 20) * 50000,
            "payment_status": "PAID"
        }
        with self.client.post("/api/events", json=payload, catch_response=True) as res:
            if res.status_code == 201:
                res.success()
            else:
                res.failure(f"Ingest failed: {res.status_code}")

    @tag('lambda_serving', 'benchmark')
    @task(3)
    def query_lambda_serving_layer(self):
        """
        [BEHAVIOR 2 - 30%]: Truy vấn Serving Layer của Kiến trúc Lambda (Batch View ⊕ Realtime Delta)
        -> Kỳ vọng: Tốc độ siêu nhanh O(1), độ trễ < 2ms bất chấp dữ liệu to đến đâu!
        """
        with self.client.get("/api/analytics/daily-revenue", catch_response=True) as res:
            if res.status_code == 200:
                res.success()
            else:
                res.failure("Lambda Serving Query failed")

    @tag('traditional_naive', 'benchmark')
    @task(1)
    def query_traditional_naive_full_scan(self):
        """
        [BEHAVIOR 3 - 10%]: Truy vấn theo cách truyền thống (Quét tuần tự toàn bộ Master Data O(N))
        -> Để so sánh: Thấy rõ độ trễ tăng vọt khi số lượng bản ghi tăng lên!
        """
        with self.client.get("/api/analytics/naive-full-scan", catch_response=True) as res:
            if res.status_code == 200:
                res.success()
            else:
                res.failure("Naive scan failed")


class ExecutiveDashboardViewerUser(HttpUser):
    """
    Nhóm User 2 (Trọng số 3): Mô phỏng các nhà quản lý (BI Analysts)
    liên tục mở Dashboard xem dữ liệu tổng hợp và kiểm tra dữ liệu thô.
    """
    weight = 3
    wait_time = between(0.5, 1.5)

    @tag('dashboard')
    @task(4)
    def refresh_analytics_dashboard(self):
        self.client.get("/api/analytics/daily-revenue")

    @tag('raw_viewer')
    @task(1)
    def inspect_raw_event_stream(self):
        self.client.get("/api/raw-events?limit=30")
