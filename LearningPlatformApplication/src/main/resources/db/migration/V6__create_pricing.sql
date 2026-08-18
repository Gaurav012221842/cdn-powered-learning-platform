CREATE TABLE course_pricing (
    id UUID PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    base_price DECIMAL(10,2) NOT NULL,
    discount_price DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'USD'
);
