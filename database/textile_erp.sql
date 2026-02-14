-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: textile_erp
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `invoice_id` int NOT NULL AUTO_INCREMENT,
  `job_id` int DEFAULT NULL,
  `labour_cost` decimal(10,2) DEFAULT NULL,
  `material_cost` decimal(10,2) DEFAULT NULL,
  `total_cost` decimal(10,2) DEFAULT NULL,
  `job_charge` decimal(10,2) DEFAULT NULL,
  `profit` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`invoice_id`),
  KEY `job_id` (`job_id`),
  CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`job_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `job_id` int NOT NULL AUTO_INCREMENT,
  `client_name` varchar(100) NOT NULL,
  `design_name` varchar(100) NOT NULL,
  `saree_count` int NOT NULL,
  `deadline` date DEFAULT NULL,
  `status` enum('Pending','In Production','Completed','Invoiced') DEFAULT 'Pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`job_id`)
) ENGINE=InnoDB AUTO_INCREMENT=101 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
INSERT INTO `jobs` VALUES (1,'ABC Traders','Floral Design',100,'2026-03-01','Pending','2026-02-14 07:28:09'),(2,'Sri Textiles','Peacock Pattern',150,'2026-03-05','Pending','2026-02-14 07:28:09'),(3,'Lakshmi Silks','Temple Border',200,'2026-03-10','Pending','2026-02-14 07:28:09'),(4,'Royal Fabrics','Traditional Gold',120,'2026-03-12','Pending','2026-02-14 07:28:09'),(5,'Meena Sarees','Modern Print',180,'2026-03-15','Pending','2026-02-14 07:28:09'),(6,'Star Textiles','Wedding Collection',250,'2026-03-18','Pending','2026-02-14 07:28:09'),(7,'Classic Looms','Cotton Special',130,'2026-03-20','Pending','2026-02-14 07:28:09'),(8,'Anand Weavers','Handloom Design',90,'2026-03-22','Pending','2026-02-14 07:28:09'),(9,'Shakti Traders','Festival Edition',160,'2026-03-25','Pending','2026-02-14 07:28:09'),(10,'Divya Silks','Premium Silk',210,'2026-03-28','Pending','2026-02-14 07:28:09'),(11,'Global Sarees','Summer Special',175,'2026-04-01','Pending','2026-02-14 07:28:09'),(12,'Heritage Fabrics','Royal Blue Theme',140,'2026-04-03','Pending','2026-02-14 07:28:09'),(13,'Krishna Textiles','Designer Series',220,'2026-04-05','Pending','2026-02-14 07:28:09'),(14,'Vinayaga Silks','Embroidery Work',190,'2026-04-08','Pending','2026-02-14 07:28:09'),(15,'Sree Collections','Classic Maroon',110,'2026-04-10','Pending','2026-02-14 07:28:09'),(16,'Nila Traders','Soft Cotton',145,'2026-04-12','Pending','2026-02-14 07:28:09'),(17,'Rani Sarees','Golden Border',155,'2026-04-15','Pending','2026-02-14 07:28:09'),(18,'Elite Textiles','Bridal Edition',230,'2026-04-18','Pending','2026-02-14 07:28:09'),(19,'Vasanth Fabrics','Ethnic Wear',170,'2026-04-20','Pending','2026-02-14 07:28:09'),(20,'Om Silks','Traditional Red',200,'2026-04-22','Pending','2026-02-14 07:28:09'),(21,'Victory Traders','Designer Cotton',135,'2026-04-25','Pending','2026-02-14 07:28:09'),(22,'Sunrise Textiles','Exclusive Pattern',165,'2026-04-28','Pending','2026-02-14 07:28:09'),(23,'Grace Sarees','Limited Edition',250,'2026-05-01','Pending','2026-02-14 07:28:09'),(24,'Arun Weavers','Festival Collection',180,'2026-05-03','Pending','2026-02-14 07:28:09'),(25,'Lotus Fabrics','Classic Yellow',140,'2026-05-05','Pending','2026-02-14 07:28:09'),(26,'Sakthi Silks','Wedding Special',210,'2026-05-08','Pending','2026-02-14 07:28:09'),(27,'Modern Traders','Lightweight Cotton',160,'2026-05-10','Pending','2026-02-14 07:28:09'),(28,'Saraswati Textiles','Traditional Green',175,'2026-05-12','Pending','2026-02-14 07:28:09'),(29,'Radha Collections','Premium Design',195,'2026-05-15','Pending','2026-02-14 07:28:09'),(30,'Dream Sarees','New Arrival',220,'2026-05-18','Pending','2026-02-14 07:28:09'),(31,'Chennai Silks','Temple Art',130,'2026-05-20','Pending','2026-02-14 07:28:09'),(32,'Madurai Textiles','Designer Print',150,'2026-05-22','Pending','2026-02-14 07:28:09'),(33,'Golden Looms','Classic Black',170,'2026-05-25','Pending','2026-02-14 07:28:09'),(34,'Silk House','Bridal Premium',260,'2026-05-28','Pending','2026-02-14 07:28:09'),(35,'Fashion Traders','Modern Trend',190,'2026-06-01','Pending','2026-02-14 07:28:09'),(36,'Elegant Sarees','Handcrafted Special',145,'2026-06-03','Pending','2026-02-14 07:28:09'),(37,'Royal Threads','Luxury Silk',200,'2026-06-05','Pending','2026-02-14 07:28:09'),(38,'Vetri Fabrics','Summer Cotton',155,'2026-06-08','Pending','2026-02-14 07:28:09'),(39,'Lakshmi Traders','Festival Special',180,'2026-06-10','Pending','2026-02-14 07:28:09'),(40,'Heritage Sarees','Vintage Series',210,'2026-06-12','Pending','2026-02-14 07:28:09'),(41,'Colorful Textiles','Bright Collection',175,'2026-06-15','Pending','2026-02-14 07:28:09'),(42,'Traditional Looms','Classic Pink',165,'2026-06-18','Pending','2026-02-14 07:28:09'),(43,'Modern Silks','Designer Bridal',240,'2026-06-20','Pending','2026-02-14 07:28:09'),(44,'Ethnic Traders','Premium Cotton',150,'2026-06-22','Pending','2026-02-14 07:28:09'),(45,'Sundaram Fabrics','Golden Zari',195,'2026-06-25','Pending','2026-02-14 07:28:09'),(46,'Priya Sarees','Exclusive Silk',220,'2026-06-28','Pending','2026-02-14 07:28:09'),(47,'Vijay Textiles','Traditional Gold',180,'2026-06-30','Pending','2026-02-14 07:28:09'),(48,'Amman Silks','Luxury Wedding',250,'2026-07-02','Pending','2026-02-14 07:28:09'),(49,'New Era Fabrics','Contemporary Design',160,'2026-07-05','Pending','2026-02-14 07:28:09'),(50,'Classic Sarees','Handloom Premium',200,'2026-07-08','Pending','2026-02-14 07:28:09'),(51,'ABC Traders','Floral Design',100,'2026-03-01','Pending','2026-02-14 13:48:05'),(52,'Sri Textiles','Peacock Pattern',150,'2026-03-05','Pending','2026-02-14 13:48:05'),(53,'Lakshmi Silks','Temple Border',200,'2026-03-10','Pending','2026-02-14 13:48:05'),(54,'Royal Fabrics','Traditional Gold',120,'2026-03-12','Pending','2026-02-14 13:48:05'),(55,'Meena Sarees','Modern Print',180,'2026-03-15','Pending','2026-02-14 13:48:05'),(56,'Star Textiles','Wedding Collection',250,'2026-03-18','Pending','2026-02-14 13:48:05'),(57,'Classic Looms','Cotton Special',130,'2026-03-20','Pending','2026-02-14 13:48:05'),(58,'Anand Weavers','Handloom Design',90,'2026-03-22','Pending','2026-02-14 13:48:05'),(59,'Shakti Traders','Festival Edition',160,'2026-03-25','Pending','2026-02-14 13:48:05'),(60,'Divya Silks','Premium Silk',210,'2026-03-28','Pending','2026-02-14 13:48:05'),(61,'Global Sarees','Summer Special',175,'2026-04-01','Pending','2026-02-14 13:48:05'),(62,'Heritage Fabrics','Royal Blue Theme',140,'2026-04-03','Pending','2026-02-14 13:48:05'),(63,'Krishna Textiles','Designer Series',220,'2026-04-05','Pending','2026-02-14 13:48:05'),(64,'Vinayaga Silks','Embroidery Work',190,'2026-04-08','Pending','2026-02-14 13:48:05'),(65,'Sree Collections','Classic Maroon',110,'2026-04-10','Pending','2026-02-14 13:48:05'),(66,'Nila Traders','Soft Cotton',145,'2026-04-12','Pending','2026-02-14 13:48:05'),(67,'Rani Sarees','Golden Border',155,'2026-04-15','Pending','2026-02-14 13:48:05'),(68,'Elite Textiles','Bridal Edition',230,'2026-04-18','Pending','2026-02-14 13:48:05'),(69,'Vasanth Fabrics','Ethnic Wear',170,'2026-04-20','Pending','2026-02-14 13:48:05'),(70,'Om Silks','Traditional Red',200,'2026-04-22','Pending','2026-02-14 13:48:05'),(71,'Victory Traders','Designer Cotton',135,'2026-04-25','Pending','2026-02-14 13:48:05'),(72,'Sunrise Textiles','Exclusive Pattern',165,'2026-04-28','Pending','2026-02-14 13:48:05'),(73,'Grace Sarees','Limited Edition',250,'2026-05-01','Pending','2026-02-14 13:48:05'),(74,'Arun Weavers','Festival Collection',180,'2026-05-03','Pending','2026-02-14 13:48:05'),(75,'Lotus Fabrics','Classic Yellow',140,'2026-05-05','Pending','2026-02-14 13:48:05'),(76,'Sakthi Silks','Wedding Special',210,'2026-05-08','Pending','2026-02-14 13:48:05'),(77,'Modern Traders','Lightweight Cotton',160,'2026-05-10','Pending','2026-02-14 13:48:05'),(78,'Saraswati Textiles','Traditional Green',175,'2026-05-12','Pending','2026-02-14 13:48:05'),(79,'Radha Collections','Premium Design',195,'2026-05-15','Pending','2026-02-14 13:48:05'),(80,'Dream Sarees','New Arrival',220,'2026-05-18','Pending','2026-02-14 13:48:05'),(81,'Chennai Silks','Temple Art',130,'2026-05-20','Pending','2026-02-14 13:48:05'),(82,'Madurai Textiles','Designer Print',150,'2026-05-22','Pending','2026-02-14 13:48:05'),(83,'Golden Looms','Classic Black',170,'2026-05-25','Pending','2026-02-14 13:48:05'),(84,'Silk House','Bridal Premium',260,'2026-05-28','Pending','2026-02-14 13:48:05'),(85,'Fashion Traders','Modern Trend',190,'2026-06-01','Pending','2026-02-14 13:48:05'),(86,'Elegant Sarees','Handcrafted Special',145,'2026-06-03','Pending','2026-02-14 13:48:05'),(87,'Royal Threads','Luxury Silk',200,'2026-06-05','Pending','2026-02-14 13:48:05'),(88,'Vetri Fabrics','Summer Cotton',155,'2026-06-08','Pending','2026-02-14 13:48:05'),(89,'Lakshmi Traders','Festival Special',180,'2026-06-10','Pending','2026-02-14 13:48:05'),(90,'Heritage Sarees','Vintage Series',210,'2026-06-12','Pending','2026-02-14 13:48:05'),(91,'Colorful Textiles','Bright Collection',175,'2026-06-15','Pending','2026-02-14 13:48:05'),(92,'Traditional Looms','Classic Pink',165,'2026-06-18','Pending','2026-02-14 13:48:05'),(93,'Modern Silks','Designer Bridal',240,'2026-06-20','Pending','2026-02-14 13:48:05'),(94,'Ethnic Traders','Premium Cotton',150,'2026-06-22','Pending','2026-02-14 13:48:05'),(95,'Sundaram Fabrics','Golden Zari',195,'2026-06-25','Pending','2026-02-14 13:48:05'),(96,'Priya Sarees','Exclusive Silk',220,'2026-06-28','Pending','2026-02-14 13:48:05'),(97,'Vijay Textiles','Traditional Gold',180,'2026-06-30','Pending','2026-02-14 13:48:05'),(98,'Amman Silks','Luxury Wedding',250,'2026-07-02','Pending','2026-02-14 13:48:05'),(99,'New Era Fabrics','Contemporary Design',160,'2026-07-05','Pending','2026-02-14 13:48:05'),(100,'Classic Sarees','Handloom Premium',200,'2026-07-08','Pending','2026-02-14 13:48:05');
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `material_issues`
--

DROP TABLE IF EXISTS `material_issues`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_issues` (
  `issue_id` int NOT NULL AUTO_INCREMENT,
  `job_id` int DEFAULT NULL,
  `material_id` int DEFAULT NULL,
  `quantity_issued` decimal(10,2) NOT NULL,
  `issued_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`issue_id`),
  KEY `job_id` (`job_id`),
  KEY `material_id` (`material_id`),
  CONSTRAINT `material_issues_ibfk_1` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`job_id`) ON DELETE CASCADE,
  CONSTRAINT `material_issues_ibfk_2` FOREIGN KEY (`material_id`) REFERENCES `raw_materials` (`material_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_issues`
--

LOCK TABLES `material_issues` WRITE;
/*!40000 ALTER TABLE `material_issues` DISABLE KEYS */;
/*!40000 ALTER TABLE `material_issues` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `production`
--

DROP TABLE IF EXISTS `production`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `production` (
  `production_id` int NOT NULL AUTO_INCREMENT,
  `job_id` int DEFAULT NULL,
  `loom_number` varchar(50) DEFAULT NULL,
  `worker_name` varchar(100) DEFAULT NULL,
  `quantity_completed` int NOT NULL,
  `production_date` date DEFAULT NULL,
  PRIMARY KEY (`production_id`),
  KEY `job_id` (`job_id`),
  CONSTRAINT `production_ibfk_1` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`job_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `production`
--

LOCK TABLES `production` WRITE;
/*!40000 ALTER TABLE `production` DISABLE KEYS */;
/*!40000 ALTER TABLE `production` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `raw_materials`
--

DROP TABLE IF EXISTS `raw_materials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `raw_materials` (
  `material_id` int NOT NULL AUTO_INCREMENT,
  `yarn_type` varchar(100) NOT NULL,
  `quantity_received` decimal(10,2) NOT NULL,
  `quantity_available` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`material_id`)
) ENGINE=InnoDB AUTO_INCREMENT=101 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `raw_materials`
--

LOCK TABLES `raw_materials` WRITE;
/*!40000 ALTER TABLE `raw_materials` DISABLE KEYS */;
INSERT INTO `raw_materials` VALUES (1,'Silk Yarn - Red',500.00,500.00,'2026-02-14 13:47:27'),(2,'Silk Yarn - Blue',450.00,450.00,'2026-02-14 13:47:27'),(3,'Silk Yarn - Green',600.00,600.00,'2026-02-14 13:47:27'),(4,'Silk Yarn - Yellow',550.00,550.00,'2026-02-14 13:47:27'),(5,'Silk Yarn - Pink',480.00,480.00,'2026-02-14 13:47:27'),(6,'Silk Yarn - Maroon',520.00,520.00,'2026-02-14 13:47:27'),(7,'Silk Yarn - Gold',700.00,700.00,'2026-02-14 13:47:27'),(8,'Silk Yarn - Silver',650.00,650.00,'2026-02-14 13:47:27'),(9,'Silk Yarn - Purple',400.00,400.00,'2026-02-14 13:47:27'),(10,'Silk Yarn - Orange',430.00,430.00,'2026-02-14 13:47:27'),(11,'Cotton Yarn - White',800.00,800.00,'2026-02-14 13:47:27'),(12,'Cotton Yarn - Cream',750.00,750.00,'2026-02-14 13:47:27'),(13,'Cotton Yarn - Black',780.00,780.00,'2026-02-14 13:47:27'),(14,'Cotton Yarn - Brown',720.00,720.00,'2026-02-14 13:47:27'),(15,'Cotton Yarn - Sky Blue',690.00,690.00,'2026-02-14 13:47:27'),(16,'Cotton Yarn - Light Green',710.00,710.00,'2026-02-14 13:47:27'),(17,'Cotton Yarn - Dark Green',730.00,730.00,'2026-02-14 13:47:27'),(18,'Cotton Yarn - Peach',640.00,640.00,'2026-02-14 13:47:27'),(19,'Cotton Yarn - Violet',600.00,600.00,'2026-02-14 13:47:27'),(20,'Cotton Yarn - Grey',670.00,670.00,'2026-02-14 13:47:27'),(21,'Zari Thread - Gold Fine',300.00,300.00,'2026-02-14 13:47:27'),(22,'Zari Thread - Silver Fine',280.00,280.00,'2026-02-14 13:47:27'),(23,'Zari Thread - Copper',260.00,260.00,'2026-02-14 13:47:27'),(24,'Zari Thread - Antique Gold',290.00,290.00,'2026-02-14 13:47:27'),(25,'Zari Thread - Designer Mix',310.00,310.00,'2026-02-14 13:47:27'),(26,'Linen Yarn - White',500.00,500.00,'2026-02-14 13:47:27'),(27,'Linen Yarn - Beige',470.00,470.00,'2026-02-14 13:47:27'),(28,'Linen Yarn - Olive',450.00,450.00,'2026-02-14 13:47:27'),(29,'Linen Yarn - Navy Blue',480.00,480.00,'2026-02-14 13:47:27'),(30,'Linen Yarn - Mustard',460.00,460.00,'2026-02-14 13:47:27'),(31,'Poly Silk - Red',520.00,520.00,'2026-02-14 13:47:27'),(32,'Poly Silk - Blue',540.00,540.00,'2026-02-14 13:47:27'),(33,'Poly Silk - Green',560.00,560.00,'2026-02-14 13:47:27'),(34,'Poly Silk - Yellow',580.00,580.00,'2026-02-14 13:47:27'),(35,'Poly Silk - Pink',600.00,600.00,'2026-02-14 13:47:27'),(36,'Handloom Cotton - Natural',650.00,650.00,'2026-02-14 13:47:27'),(37,'Handloom Cotton - Dyed',620.00,620.00,'2026-02-14 13:47:27'),(38,'Handloom Silk - Premium',700.00,700.00,'2026-02-14 13:47:27'),(39,'Handloom Silk - Standard',680.00,680.00,'2026-02-14 13:47:27'),(40,'Organic Cotton - White',720.00,720.00,'2026-02-14 13:47:27'),(41,'Organic Cotton - Cream',740.00,740.00,'2026-02-14 13:47:27'),(42,'Organic Cotton - Brown',760.00,760.00,'2026-02-14 13:47:27'),(43,'Bamboo Yarn - Natural',500.00,500.00,'2026-02-14 13:47:27'),(44,'Bamboo Yarn - Dyed',480.00,480.00,'2026-02-14 13:47:27'),(45,'Rayon Yarn - Red',530.00,530.00,'2026-02-14 13:47:27'),(46,'Rayon Yarn - Blue',510.00,510.00,'2026-02-14 13:47:27'),(47,'Rayon Yarn - Green',490.00,490.00,'2026-02-14 13:47:27'),(48,'Designer Blend - Silk Mix',600.00,600.00,'2026-02-14 13:47:27'),(49,'Designer Blend - Cotton Mix',620.00,620.00,'2026-02-14 13:47:27'),(50,'Premium Zari Combo',350.00,350.00,'2026-02-14 13:47:27'),(51,'Silk Yarn - Red',500.00,500.00,'2026-02-14 13:47:36'),(52,'Silk Yarn - Blue',450.00,450.00,'2026-02-14 13:47:36'),(53,'Silk Yarn - Green',600.00,600.00,'2026-02-14 13:47:36'),(54,'Silk Yarn - Yellow',550.00,550.00,'2026-02-14 13:47:36'),(55,'Silk Yarn - Pink',480.00,480.00,'2026-02-14 13:47:36'),(56,'Silk Yarn - Maroon',520.00,520.00,'2026-02-14 13:47:36'),(57,'Silk Yarn - Gold',700.00,700.00,'2026-02-14 13:47:36'),(58,'Silk Yarn - Silver',650.00,650.00,'2026-02-14 13:47:36'),(59,'Silk Yarn - Purple',400.00,400.00,'2026-02-14 13:47:36'),(60,'Silk Yarn - Orange',430.00,430.00,'2026-02-14 13:47:36'),(61,'Cotton Yarn - White',800.00,800.00,'2026-02-14 13:47:36'),(62,'Cotton Yarn - Cream',750.00,750.00,'2026-02-14 13:47:36'),(63,'Cotton Yarn - Black',780.00,780.00,'2026-02-14 13:47:36'),(64,'Cotton Yarn - Brown',720.00,720.00,'2026-02-14 13:47:36'),(65,'Cotton Yarn - Sky Blue',690.00,690.00,'2026-02-14 13:47:36'),(66,'Cotton Yarn - Light Green',710.00,710.00,'2026-02-14 13:47:36'),(67,'Cotton Yarn - Dark Green',730.00,730.00,'2026-02-14 13:47:36'),(68,'Cotton Yarn - Peach',640.00,640.00,'2026-02-14 13:47:36'),(69,'Cotton Yarn - Violet',600.00,600.00,'2026-02-14 13:47:36'),(70,'Cotton Yarn - Grey',670.00,670.00,'2026-02-14 13:47:36'),(71,'Zari Thread - Gold Fine',300.00,300.00,'2026-02-14 13:47:36'),(72,'Zari Thread - Silver Fine',280.00,280.00,'2026-02-14 13:47:36'),(73,'Zari Thread - Copper',260.00,260.00,'2026-02-14 13:47:36'),(74,'Zari Thread - Antique Gold',290.00,290.00,'2026-02-14 13:47:36'),(75,'Zari Thread - Designer Mix',310.00,310.00,'2026-02-14 13:47:36'),(76,'Linen Yarn - White',500.00,500.00,'2026-02-14 13:47:36'),(77,'Linen Yarn - Beige',470.00,470.00,'2026-02-14 13:47:36'),(78,'Linen Yarn - Olive',450.00,450.00,'2026-02-14 13:47:36'),(79,'Linen Yarn - Navy Blue',480.00,480.00,'2026-02-14 13:47:36'),(80,'Linen Yarn - Mustard',460.00,460.00,'2026-02-14 13:47:36'),(81,'Poly Silk - Red',520.00,520.00,'2026-02-14 13:47:36'),(82,'Poly Silk - Blue',540.00,540.00,'2026-02-14 13:47:36'),(83,'Poly Silk - Green',560.00,560.00,'2026-02-14 13:47:36'),(84,'Poly Silk - Yellow',580.00,580.00,'2026-02-14 13:47:36'),(85,'Poly Silk - Pink',600.00,600.00,'2026-02-14 13:47:36'),(86,'Handloom Cotton - Natural',650.00,650.00,'2026-02-14 13:47:36'),(87,'Handloom Cotton - Dyed',620.00,620.00,'2026-02-14 13:47:36'),(88,'Handloom Silk - Premium',700.00,700.00,'2026-02-14 13:47:36'),(89,'Handloom Silk - Standard',680.00,680.00,'2026-02-14 13:47:36'),(90,'Organic Cotton - White',720.00,720.00,'2026-02-14 13:47:36'),(91,'Organic Cotton - Cream',740.00,740.00,'2026-02-14 13:47:36'),(92,'Organic Cotton - Brown',760.00,760.00,'2026-02-14 13:47:36'),(93,'Bamboo Yarn - Natural',500.00,500.00,'2026-02-14 13:47:36'),(94,'Bamboo Yarn - Dyed',480.00,480.00,'2026-02-14 13:47:36'),(95,'Rayon Yarn - Red',530.00,530.00,'2026-02-14 13:47:36'),(96,'Rayon Yarn - Blue',510.00,510.00,'2026-02-14 13:47:36'),(97,'Rayon Yarn - Green',490.00,490.00,'2026-02-14 13:47:36'),(98,'Designer Blend - Silk Mix',600.00,600.00,'2026-02-14 13:47:36'),(99,'Designer Blend - Cotton Mix',620.00,620.00,'2026-02-14 13:47:36'),(100,'Premium Zari Combo',350.00,350.00,'2026-02-14 13:47:36');
/*!40000 ALTER TABLE `raw_materials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','supervisor','staff') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'User1','user1@test.com','123456','admin','2026-02-14 07:26:25'),(2,'User2','user2@test.com','123456','supervisor','2026-02-14 07:26:25'),(3,'User3','user3@test.com','123456','staff','2026-02-14 07:26:25'),(4,'User4','user4@test.com','123456','staff','2026-02-14 07:26:25'),(5,'User5','user5@test.com','123456','staff','2026-02-14 07:26:25'),(6,'User6','user6@test.com','123456','supervisor','2026-02-14 07:26:25'),(7,'User7','user7@test.com','123456','staff','2026-02-14 07:26:25'),(8,'User8','user8@test.com','123456','staff','2026-02-14 07:26:25'),(9,'User9','user9@test.com','123456','admin','2026-02-14 07:26:25'),(10,'User10','user10@test.com','123456','staff','2026-02-14 07:26:25'),(11,'User11','user11@test.com','123456','staff','2026-02-14 07:26:25'),(12,'User12','user12@test.com','123456','supervisor','2026-02-14 07:26:25'),(13,'User13','user13@test.com','123456','staff','2026-02-14 07:26:25'),(14,'User14','user14@test.com','123456','staff','2026-02-14 07:26:25'),(15,'User15','user15@test.com','123456','admin','2026-02-14 07:26:25'),(16,'User16','user16@test.com','123456','staff','2026-02-14 07:26:25'),(17,'User17','user17@test.com','123456','staff','2026-02-14 07:26:25'),(18,'User18','user18@test.com','123456','supervisor','2026-02-14 07:26:25'),(19,'User19','user19@test.com','123456','staff','2026-02-14 07:26:25'),(20,'User20','user20@test.com','123456','staff','2026-02-14 07:26:25'),(21,'User21','user21@test.com','123456','admin','2026-02-14 07:26:25'),(22,'User22','user22@test.com','123456','staff','2026-02-14 07:26:25'),(23,'User23','user23@test.com','123456','staff','2026-02-14 07:26:25'),(24,'User24','user24@test.com','123456','supervisor','2026-02-14 07:26:25'),(25,'User25','user25@test.com','123456','staff','2026-02-14 07:26:25'),(26,'User26','user26@test.com','123456','staff','2026-02-14 07:26:25'),(27,'User27','user27@test.com','123456','admin','2026-02-14 07:26:25'),(28,'User28','user28@test.com','123456','staff','2026-02-14 07:26:25'),(29,'User29','user29@test.com','123456','staff','2026-02-14 07:26:25'),(30,'User30','user30@test.com','123456','supervisor','2026-02-14 07:26:25'),(31,'User31','user31@test.com','123456','staff','2026-02-14 07:26:25'),(32,'User32','user32@test.com','123456','staff','2026-02-14 07:26:25'),(33,'User33','user33@test.com','123456','admin','2026-02-14 07:26:25'),(34,'User34','user34@test.com','123456','staff','2026-02-14 07:26:25'),(35,'User35','user35@test.com','123456','staff','2026-02-14 07:26:25'),(36,'User36','user36@test.com','123456','supervisor','2026-02-14 07:26:25'),(37,'User37','user37@test.com','123456','staff','2026-02-14 07:26:25'),(38,'User38','user38@test.com','123456','staff','2026-02-14 07:26:25'),(39,'User39','user39@test.com','123456','admin','2026-02-14 07:26:25'),(40,'User40','user40@test.com','123456','staff','2026-02-14 07:26:25'),(41,'User41','user41@test.com','123456','staff','2026-02-14 07:26:25'),(42,'User42','user42@test.com','123456','supervisor','2026-02-14 07:26:25'),(43,'User43','user43@test.com','123456','staff','2026-02-14 07:26:25'),(44,'User44','user44@test.com','123456','staff','2026-02-14 07:26:25'),(45,'User45','user45@test.com','123456','admin','2026-02-14 07:26:25'),(46,'User46','user46@test.com','123456','staff','2026-02-14 07:26:25'),(47,'User47','user47@test.com','123456','staff','2026-02-14 07:26:25'),(48,'User48','user48@test.com','123456','supervisor','2026-02-14 07:26:25'),(49,'User49','user49@test.com','123456','staff','2026-02-14 07:26:25'),(50,'User50','user50@test.com','123456','staff','2026-02-14 07:26:25');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-14 20:16:46
