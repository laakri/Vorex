import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Database connection
db_engine = None

def init_db():
    """Initialize database connection."""
    global db_engine
    
    # Get database connection string from environment variables
    db_url = os.environ.get('DATABASE_URL')
    
    if not db_url:
        # Default to local development settings if not provided
        user = os.environ.get('DB_USER', 'postgres')
        password = os.environ.get('DB_PASSWORD', 'postgres')
        host = os.environ.get('DB_HOST', 'localhost')
        port = os.environ.get('DB_PORT', '5432')
        database = os.environ.get('DB_NAME', 'vorex')
        
        db_url = f"postgresql://{user}:{password}@{host}:{port}/{database}"
    
    logger.info(f"Connecting to database at {host}:{port}")
    
    try:
        db_engine = create_engine(db_url)
        # Test connection
        with db_engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            logger.info("Database connection successful")
    except Exception as e:
        logger.error(f"Database connection failed: {str(e)}")
        raise

def get_vehicle_data(driver_id):
    """Retrieve vehicle data for a specific driver."""
    if not db_engine:
        init_db()
    
    try:
        # Query to get vehicle data
        # This matches the schema.prisma definitions
        query = text("""
            SELECT 
                d.id as driver_id,
                u."fullName" as driver_name,
                v.id as vehicle_id,
                v.make,
                v.model,
                v.year,
                v."plateNumber" as licensePlate,
                v."currentStatus" as status,
                v."lastMaintenance",
                v."nextMaintenance"
            FROM "Driver" d
            JOIN "User" u ON d."userId" = u.id
            LEFT JOIN "Vehicle" v ON d."vehicleId" = v.id
            WHERE d.id = :driver_id
        """)
        
        with db_engine.connect() as conn:
            result = conn.execute(query, {"driver_id": driver_id})
            
            # Convert result to dictionary
            rows = result.fetchall()
            if not rows:
                logger.warning(f"No vehicle data found for driver {driver_id}")
                return {"error": "No vehicle data found"}
            
            # Extract column names
            columns = result.keys()
            
            # Create a list of dictionaries
            vehicle_data = []
            for row in rows:
                vehicle_dict = {}
                for i, column in enumerate(columns):
                    vehicle_dict[column] = row[i]
                vehicle_data.append(vehicle_dict)
            
            # Try to get maintenance records for the vehicle
            if vehicle_data and vehicle_data[0].get('vehicle_id'):
                vehicle_id = vehicle_data[0]['vehicle_id']
                maintenance_records = get_maintenance_records(vehicle_id)
                if maintenance_records:
                    vehicle_data[0]['maintenance_records'] = maintenance_records
            
            return {"vehicles": vehicle_data}
    
    except Exception as e:
        logger.error(f"Error retrieving vehicle data: {str(e)}")
        raise

def get_maintenance_records(vehicle_id):
    """Retrieve maintenance records for a specific vehicle."""
    if not db_engine:
        init_db()
    
    try:
        # Query to get maintenance history based on the schema
        query = text("""
            SELECT 
                m.id,
                m."vehicleId",
                m.type,
                m.description,
                m.date,
                m.cost,
                m.odometer,
                m.status
            FROM "MaintenanceRecord" m
            WHERE m."vehicleId" = :vehicle_id
            ORDER BY m.date DESC
        """)
        
        with db_engine.connect() as conn:
            result = conn.execute(query, {"vehicle_id": vehicle_id})
            
            # Convert result to dictionary
            rows = result.fetchall()
            if not rows:
                logger.info(f"No maintenance records found for vehicle {vehicle_id}")
                return []
            
            # Extract column names
            columns = result.keys()
            
            # Create a list of dictionaries
            maintenance_data = []
            for row in rows:
                maintenance_dict = {}
                for i, column in enumerate(columns):
                    maintenance_dict[column] = row[i]
                maintenance_data.append(maintenance_dict)
            
            return maintenance_data
    
    except Exception as e:
        logger.error(f"Error retrieving maintenance records: {str(e)}")
        return []

def get_vehicle_issues(vehicle_id):
    """Retrieve issues for a specific vehicle."""
    if not db_engine:
        init_db()
    
    try:
        # Query to get vehicle issues
        query = text("""
            SELECT 
                i.id,
                i."vehicleId",
                i.title,
                i.description,
                i."reportedAt",
                i.status,
                i.priority
            FROM "VehicleIssue" i
            WHERE i."vehicleId" = :vehicle_id
            ORDER BY i."reportedAt" DESC
        """)
        
        with db_engine.connect() as conn:
            result = conn.execute(query, {"vehicle_id": vehicle_id})
            
            # Convert result to dictionary
            rows = result.fetchall()
            if not rows:
                logger.info(f"No issues found for vehicle {vehicle_id}")
                return []
            
            # Extract column names
            columns = result.keys()
            
            # Create a list of dictionaries
            issues_data = []
            for row in rows:
                issue_dict = {}
                for i, column in enumerate(columns):
                    issue_dict[column] = row[i]
                issues_data.append(issue_dict)
            
            return issues_data
    
    except Exception as e:
        logger.error(f"Error retrieving vehicle issues: {str(e)}")
        return [] 