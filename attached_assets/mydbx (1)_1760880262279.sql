-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 19, 2025 at 03:23 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `mydbx`
--

-- --------------------------------------------------------

--
-- Table structure for table `tbl_allowances`
--

CREATE TABLE `tbl_allowances` (
  `id` int(11) NOT NULL,
  `country_id` int(11) NOT NULL,
  `dept_id` int(11) NOT NULL,
  `place_id` int(11) NOT NULL,
  `scale` varchar(6) NOT NULL,
  `amounts` decimal(11,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_allowances`
--

INSERT INTO `tbl_allowances` (`id`, `country_id`, `dept_id`, `place_id`, `scale`, `amounts`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1, '4', 6300.00, '2025-05-25 06:05:54', NULL, NULL),
(2, 1, 1, 1, '5', 6300.00, '2025-05-25 06:05:54', NULL, NULL),
(3, 1, 1, 1, '8', 6300.00, '2025-05-25 06:05:54', NULL, NULL),
(4, 1, 1, 1, '13', 11200.00, '2025-05-25 06:06:52', NULL, NULL),
(5, 1, 1, 1, '14', 11200.00, '2025-05-25 06:06:52', NULL, NULL),
(6, 1, 1, 1, '15', 11200.00, '2025-05-25 06:06:52', NULL, NULL),
(7, 1, 1, 1, '16', 11200.00, '2025-05-25 06:06:52', NULL, NULL),
(8, 1, 1, 1, '6', 14000.00, '2025-05-25 06:07:40', NULL, NULL),
(9, 1, 1, 1, '7', 14000.00, '2025-05-25 06:07:40', NULL, NULL),
(10, 1, 1, 1, '17', 14000.00, '2025-05-25 06:07:40', NULL, NULL),
(11, 1, 1, 1, '18', 16000.00, '2025-05-25 06:08:27', NULL, NULL),
(12, 1, 1, 1, '24', 17500.00, '2025-06-07 15:35:43', NULL, NULL),
(13, 1, 1, 1, '25', 17500.00, '2025-06-07 15:35:43', NULL, NULL),
(14, 1, 1, 1, '26', 17500.00, '2025-06-07 15:35:43', NULL, NULL),
(15, 1, 1, 1, '27', 17500.00, '2025-06-07 15:35:43', NULL, NULL),
(16, 1, 1, 1, '28', 17500.00, '2025-06-07 15:35:43', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_audits`
--

CREATE TABLE `tbl_audits` (
  `id` int(11) NOT NULL,
  `dept_id` int(11) NOT NULL,
  `user_email` varchar(50) NOT NULL,
  `user_id` varchar(15) NOT NULL,
  `ip_address` varchar(20) NOT NULL,
  `operations` varchar(255) NOT NULL,
  `locations` varchar(45) NOT NULL,
  `machine` varchar(60) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_audits`
--

INSERT INTO `tbl_audits` (`id`, `dept_id`, `user_email`, `user_id`, `ip_address`, `operations`, `locations`, `machine`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Mrs Muyoma, Salome Nafula was paid 25200 Shillings - Traning for SMC by KSG', 'Location data not available', 'Edge on Windows 10', '2025-06-07 14:46:32', '2025-06-07 14:46:32', '0000-00-00 00:00:00'),
(2, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Mrs Autai, Linah Ing\'iro was paid 25200 Shillings - Traning for SMC by KSG', 'Location data not available', 'Edge on Windows 10', '2025-06-07 14:46:45', '2025-06-07 14:46:45', '0000-00-00 00:00:00'),
(3, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Deleted claim voucher # 0001 from transaction table', 'Location data not available', 'Edge on Windows 10', '2025-06-07 15:23:39', '2025-06-07 15:23:39', '0000-00-00 00:00:00'),
(4, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Deleted claim voucher # 0001 from transaction table', 'Location data not available', 'Edge on Windows 10', '2025-06-07 15:23:50', '2025-06-07 15:23:50', '0000-00-00 00:00:00'),
(5, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Deleted claim voucher # 0002 from transaction table', 'Location data not available', 'Edge on Windows 10', '2025-06-07 15:23:58', '2025-06-07 15:23:58', '0000-00-00 00:00:00'),
(6, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Mr Wamoto, Peter Maloba was paid 70000 Shillings - Traning for SMC by KSG', 'Location data not available', 'Edge on Windows 10', '2025-06-07 15:37:07', '2025-06-07 15:37:07', '0000-00-00 00:00:00'),
(7, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Mr Warui, Samuel Njoroge was paid 70000 Shillings - Traning for SMC by KSG', 'Location data not available', 'Edge on Windows 10', '2025-06-07 15:37:08', '2025-06-07 15:37:08', '0000-00-00 00:00:00'),
(8, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Mr Wamoto, Peter Maloba was paid 78400 Shillings - Traning for SMC by KSG', 'Location data not available', 'Edge on Windows 10', '2025-06-10 09:49:42', '2025-06-10 09:49:42', '0000-00-00 00:00:00'),
(9, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Mr Warui, Samuel Njoroge was paid 78400 Shillings - Traning for SMC by KSG', 'Location data not available', 'Edge on Windows 10', '2025-06-10 09:49:43', '2025-06-10 09:49:43', '0000-00-00 00:00:00'),
(10, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Mr Wamoto, Peter Maloba was paid 71100 Shillings - Traning for SMC by KSG', 'Location data not available', 'Edge on Windows 10', '2025-06-10 10:01:46', '2025-06-10 10:01:46', '0000-00-00 00:00:00'),
(11, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Mr Warui, Samuel Njoroge was paid 71100 Shillings - Traning for SMC by KSG', 'Location data not available', 'Edge on Windows 10', '2025-06-10 10:01:47', '2025-06-10 10:01:47', '0000-00-00 00:00:00'),
(12, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Deleted claim voucher # 0001 from transaction table', 'Location data not available', 'Edge on Windows 10', '2025-06-10 10:03:35', '2025-06-10 10:03:35', '0000-00-00 00:00:00'),
(13, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Deleted claim voucher # 0002 from transaction table', 'Location data not available', 'Edge on Windows 10', '2025-06-10 10:03:38', '2025-06-10 10:03:38', '0000-00-00 00:00:00'),
(14, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Deleted claim voucher # 0003 from transaction table', 'Location data not available', 'Edge on Windows 10', '2025-06-10 10:03:42', '2025-06-10 10:03:42', '0000-00-00 00:00:00'),
(15, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Deleted claim voucher # 0004 from transaction table', 'Location data not available', 'Edge on Windows 10', '2025-06-10 10:03:45', '2025-06-10 10:03:45', '0000-00-00 00:00:00'),
(16, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Deleted claim voucher # 0005 from transaction table', 'Location data not available', 'Edge on Windows 10', '2025-06-10 10:03:48', '2025-06-10 10:03:48', '0000-00-00 00:00:00'),
(17, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Deleted claim voucher # 0006 from transaction table', 'Location data not available', 'Edge on Windows 10', '2025-06-10 10:03:51', '2025-06-10 10:03:51', '0000-00-00 00:00:00'),
(18, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Mr Wamoto, Peter Maloba was paid 71300 Shillings - Traning for SMC by KSG', 'Location data not available', 'Edge on Windows 10', '2025-06-10 10:24:42', '2025-06-10 10:24:42', '0000-00-00 00:00:00'),
(19, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Mr Warui, Samuel Njoroge was paid 71300 Shillings - Traning for SMC by KSG', 'Location data not available', 'Edge on Windows 10', '2025-06-10 10:24:43', '2025-06-10 10:24:43', '0000-00-00 00:00:00'),
(20, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Mrs Khaoya, Elymaryta Agatha was paid 71300 Shillings - Traning for SMC by KSG', 'Location data not available', 'Edge on Windows 10', '2025-06-10 10:24:44', '2025-06-10 10:24:44', '0000-00-00 00:00:00'),
(21, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Mrs Chebet, Judith Ruttoh was paid 46100 Shillings - Traning for SMC by KSG', 'Location data not available', 'Edge on Windows 10', '2025-06-10 10:24:44', '2025-06-10 10:24:44', '0000-00-00 00:00:00'),
(22, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Mr Wafula, Moses Juma was paid 26500 Shillings - Traning for SMC by KSG', 'Location data not available', 'Edge on Windows 10', '2025-06-10 10:24:45', '2025-06-10 10:24:45', '0000-00-00 00:00:00'),
(23, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Miss Wanyama, Daisy Nafula was paid 46100 Shillings - Traning for SMC by KSG', 'Location data not available', 'Edge on Windows 10', '2025-06-10 10:24:46', '2025-06-10 10:24:46', '0000-00-00 00:00:00'),
(24, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Mrs Musonye, Nancy Nasiali was paid 46100 Shillings - Traning for SMC by KSG', 'Location data not available', 'Edge on Windows 10', '2025-06-10 10:24:47', '2025-06-10 10:24:47', '0000-00-00 00:00:00'),
(25, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Mrs Omai, Loice Imbogo was paid 46100 Shillings - Traning for SMC by KSG', 'Location data not available', 'Edge on Windows 10', '2025-06-10 10:24:47', '2025-06-10 10:24:47', '0000-00-00 00:00:00'),
(26, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Mr Osanya, Joseph Frechi was paid 26500 Shillings - Traning for SMC by KSG', 'Location data not available', 'Edge on Windows 10', '2025-06-10 10:24:48', '2025-06-10 10:24:48', '0000-00-00 00:00:00'),
(27, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Miss Kipsat, Judith Cherotich was paid 46100 Shillings - Traning for SMC by KSG', 'Location data not available', 'Edge on Windows 10', '2025-06-10 10:24:49', '2025-06-10 10:24:49', '0000-00-00 00:00:00'),
(28, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Mr Mwambu, Casper Nalwelisie was paid 26500 Shillings - Traning for SMC by KSG', 'Location data not available', 'Edge on Windows 10', '2025-06-10 10:24:50', '2025-06-10 10:24:50', '0000-00-00 00:00:00'),
(29, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Deleted claim voucher # 0010 from transaction table', 'Location data not available', 'Edge on Windows 10', '2025-06-10 10:56:43', '2025-06-10 10:56:43', '0000-00-00 00:00:00'),
(30, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Deleted claim voucher # 0009 from transaction table', 'Location data not available', 'Edge on Windows 10', '2025-06-10 10:56:47', '2025-06-10 10:56:47', '0000-00-00 00:00:00'),
(31, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Deleted claim voucher # 0006 from transaction table', 'Location data not available', 'Edge on Windows 10', '2025-06-10 10:56:50', '2025-06-10 10:56:50', '0000-00-00 00:00:00'),
(32, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Deleted claim voucher # 0004 from transaction table', 'Location data not available', 'Edge on Windows 10', '2025-06-10 10:56:52', '2025-06-10 10:56:52', '0000-00-00 00:00:00'),
(33, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Deleted claim voucher # 0001 from transaction table', 'Location data not available', 'Edge on Windows 10', '2025-06-10 10:56:56', '2025-06-10 10:56:56', '0000-00-00 00:00:00'),
(34, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Deleted claim voucher # 0002 from transaction table', 'Location data not available', 'Edge on Windows 10', '2025-06-10 10:57:00', '2025-06-10 10:57:00', '0000-00-00 00:00:00'),
(35, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Deleted claim voucher # 0003 from transaction table', 'Location data not available', 'Edge on Windows 10', '2025-06-10 10:57:03', '2025-06-10 10:57:03', '0000-00-00 00:00:00'),
(36, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Deleted claim voucher # 0005 from transaction table', 'Location data not available', 'Edge on Windows 10', '2025-06-10 10:57:06', '2025-06-10 10:57:06', '0000-00-00 00:00:00'),
(37, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Deleted claim voucher # 0007 from transaction table', 'Location data not available', 'Edge on Windows 10', '2025-06-10 10:57:09', '2025-06-10 10:57:09', '0000-00-00 00:00:00'),
(38, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Deleted claim voucher # 0011 from transaction table', 'Location data not available', 'Edge on Windows 10', '2025-06-10 10:57:13', '2025-06-10 10:57:13', '0000-00-00 00:00:00'),
(39, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Deleted claim voucher # 0008 from transaction table', 'Location data not available', 'Edge on Windows 10', '2025-06-10 10:57:17', '2025-06-10 10:57:17', '0000-00-00 00:00:00'),
(40, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Mr Wamoto, Peter Maloba was paid 71900 Shillings - Team Building', 'Location data not available', 'Edge on Windows 10', '2025-06-10 11:35:16', '2025-06-10 11:35:16', '0000-00-00 00:00:00'),
(41, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Mr Warui, Samuel Njoroge was paid 71900 Shillings - Team Building', 'Location data not available', 'Edge on Windows 10', '2025-06-10 11:35:16', '2025-06-10 11:35:16', '0000-00-00 00:00:00'),
(42, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Mrs Khaoya, Elymaryta Agatha was paid 71900 Shillings - Team Building', 'Location data not available', 'Edge on Windows 10', '2025-06-10 11:35:17', '2025-06-10 11:35:17', '0000-00-00 00:00:00'),
(43, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Mrs Chebet, Judith Ruttoh was paid 46700 Shillings - Team Building', 'Location data not available', 'Edge on Windows 10', '2025-06-10 11:35:18', '2025-06-10 11:35:18', '0000-00-00 00:00:00'),
(44, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Mr Wafula, Moses Juma was paid 27100 Shillings - Team Building', 'Location data not available', 'Edge on Windows 10', '2025-06-10 11:35:19', '2025-06-10 11:35:19', '0000-00-00 00:00:00'),
(45, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Miss Wanyama, Daisy Nafula was paid 46700 Shillings - Team Building', 'Location data not available', 'Edge on Windows 10', '2025-06-10 11:35:19', '2025-06-10 11:35:19', '0000-00-00 00:00:00'),
(46, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Mrs Musonye, Nancy Nasiali was paid 46700 Shillings - Team Building', 'Location data not available', 'Edge on Windows 10', '2025-06-10 11:35:20', '2025-06-10 11:35:20', '0000-00-00 00:00:00'),
(47, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Mrs Omai, Loice Imbogo was paid 46700 Shillings - Team Building', 'Location data not available', 'Edge on Windows 10', '2025-06-10 11:35:21', '2025-06-10 11:35:21', '0000-00-00 00:00:00'),
(48, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Mr Osanya, Joseph Frechi was paid 27100 Shillings - Team Building', 'Location data not available', 'Edge on Windows 10', '2025-06-10 11:35:22', '2025-06-10 11:35:22', '0000-00-00 00:00:00'),
(49, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Miss Kipsat, Judith Cherotich was paid 46700 Shillings - Team Building', 'Location data not available', 'Edge on Windows 10', '2025-06-10 11:35:22', '2025-06-10 11:35:22', '0000-00-00 00:00:00'),
(50, 1, 'mosesjumawafula@gmail.com', '2', '::1', 'Mr Mwambu, Casper Nalwelisie was paid 27100 Shillings - Team Building', 'Location data not available', 'Edge on Windows 10', '2025-06-10 11:35:23', '2025-06-10 11:35:23', '0000-00-00 00:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_budget_estimate`
--

CREATE TABLE `tbl_budget_estimate` (
  `id` int(11) NOT NULL,
  `dept_id` int(11) NOT NULL,
  `fy` varchar(10) NOT NULL,
  `vote_id` varchar(20) DEFAULT NULL,
  `estimated_amt` decimal(15,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_budget_estimate`
--

INSERT INTO `tbl_budget_estimate` (`id`, `dept_id`, `fy`, `vote_id`, `estimated_amt`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, '2024/2025', '1000000', 1000000.00, '2025-02-20 13:59:48', '2025-02-20 18:57:36', '0000-00-00 00:00:00'),
(2, 1, '2024/2025', '2210100', 350000.00, '2025-02-20 13:59:48', '2025-02-20 18:57:36', '0000-00-00 00:00:00'),
(3, 1, '2024/2025', '2210101', 50000.00, '2025-02-20 13:59:48', '2025-02-20 18:57:36', '0000-00-00 00:00:00'),
(4, 1, '2024/2025', '2210102', 300000.00, '2025-02-20 13:59:48', '2025-02-20 18:57:36', '0000-00-00 00:00:00'),
(5, 1, '2024/2025', '2210200', 100000.00, '2025-02-20 13:59:48', '2025-02-20 18:57:36', '0000-00-00 00:00:00'),
(6, 1, '2024/2025', '2210201', 40000.00, '2025-02-20 13:59:48', '2025-02-20 18:57:36', '0000-00-00 00:00:00'),
(7, 1, '2024/2025', '2210202', 20000.00, '2025-02-20 13:59:48', '2025-02-20 18:57:36', '0000-00-00 00:00:00'),
(8, 1, '2024/2025', '2210203', 30000.00, '2025-02-20 13:59:48', '2025-02-20 18:57:36', '0000-00-00 00:00:00'),
(9, 1, '2024/2025', '2210300', 40000.00, '2025-02-20 13:59:48', '2025-02-20 18:57:36', '0000-00-00 00:00:00'),
(10, 1, '2024/2025', '2210301', 50000.00, '2025-02-20 13:59:48', '2025-02-20 18:57:36', '0000-00-00 00:00:00'),
(11, 1, '2024/2025', '2210302', 60000.00, '2025-02-20 13:59:48', '2025-02-20 18:57:36', '0000-00-00 00:00:00'),
(12, 1, '2024/2025', '2210303', 70000.00, '2025-02-20 13:59:48', '2025-02-20 18:57:36', '0000-00-00 00:00:00'),
(13, 1, '2024/2025', '2210400', 80000.00, '2025-02-20 13:59:48', '2025-02-20 18:57:36', '0000-00-00 00:00:00'),
(14, 1, '2024/2025', '2210401', 90000.00, '2025-02-20 13:59:48', '2025-02-20 18:57:36', '0000-00-00 00:00:00'),
(15, 1, '2025/26', '1000000', 900070.00, '2025-05-25 01:42:43', '2025-05-25 04:42:43', '0000-00-00 00:00:00'),
(16, 1, '2025/26', '2210100', 176000.00, '2025-05-25 01:43:52', '2025-05-25 04:43:52', '0000-00-00 00:00:00'),
(17, 1, '2024/2025', 'C', 20000.00, '2025-05-30 05:12:37', '2025-05-30 08:12:37', '0000-00-00 00:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_country`
--

CREATE TABLE `tbl_country` (
  `id` int(11) NOT NULL,
  `name` varchar(30) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_country`
--

INSERT INTO `tbl_country` (`id`, `name`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'Kenya', '2024-12-02 06:41:25', NULL, NULL),
(2, 'Uganda', '2024-12-09 23:51:13', '2024-12-10 02:51:13', NULL),
(3, 'Tanzania', '2024-12-09 23:51:25', '2024-12-10 02:51:25', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_county`
--

CREATE TABLE `tbl_county` (
  `id` int(11) NOT NULL,
  `country_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_county`
--

INSERT INTO `tbl_county` (`id`, `country_id`, `name`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 'trans nzoia county', '2024-12-02 06:41:53', NULL, NULL),
(2, 1, 'Bungoma County', '2024-12-09 23:52:06', '2024-12-10 02:52:06', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_dept`
--

CREATE TABLE `tbl_dept` (
  `id` int(11) NOT NULL,
  `cm_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `head` varchar(50) NOT NULL,
  `sub_head` varchar(50) NOT NULL,
  `vote_no` varchar(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_dept`
--

INSERT INTO `tbl_dept` (`id`, `cm_id`, `name`, `head`, `sub_head`, `vote_no`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 'Test Department', 'test head', 'test sub head', '1', '2025-05-24 16:15:45', '2025-05-24 16:15:45', NULL),
(2, 1, 'County Public Service Board', '', '', '', '2024-12-09 23:52:58', '2024-12-10 02:52:58', NULL),
(4, 1, 'Economic', '', '', '', '2025-05-24 13:36:29', '2025-05-24 16:36:29', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_employees`
--

CREATE TABLE `tbl_employees` (
  `id` int(11) NOT NULL,
  `dept_id` int(11) NOT NULL,
  `personal_no` varchar(15) NOT NULL,
  `name` varchar(50) NOT NULL,
  `gnd` char(1) NOT NULL,
  `jg` varchar(5) NOT NULL,
  `designation` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_employees`
--

INSERT INTO `tbl_employees` (`id`, `dept_id`, `personal_no`, `name`, `gnd`, `jg`, `designation`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, '1979022930', 'Mr Wamoto, Peter Maloba', 'M', '7', 'Chairman - County Public Service Board', '2025-06-07 15:21:17', NULL, NULL),
(2, 1, '1980081620', 'Mr Warui, Samuel Njoroge', 'M', '8', 'Member - County Public Service Board', '2025-06-07 15:21:17', NULL, NULL),
(3, 1, '1982023181', 'Mrs Khaoya, Elymaryta Agatha', 'F', '8', 'Member - County Public Service Board', '2025-06-07 15:21:17', NULL, NULL),
(4, 1, '2010113122', 'Mrs Chebet, Judith Ruttoh', 'F', 'K', 'Accountant[1]', '2025-06-07 15:21:17', NULL, NULL),
(5, 1, '20140051181', 'Mr Wafula, Moses Juma', 'M', 'J', 'ICT Officer [2]', '2025-06-07 15:21:41', NULL, NULL),
(6, 1, '20180006946', 'Miss Wanyama, Daisy Nafula', 'F', 'K', 'HRM & Development Officer[1]', '2025-06-07 15:21:17', NULL, NULL),
(7, 1, '20180007103', 'Mrs Musonye, Nancy Nasiali', 'F', 'K', 'HRM & Development Officer[1]', '2025-06-07 15:21:17', NULL, NULL),
(8, 1, '2007006683', 'Mrs Omai, Loice Imbogo', 'F', 'M', 'Chief Office Administrator', '2025-06-07 15:21:17', NULL, NULL),
(9, 1, '2007134038', 'Mr Osanya, Joseph Frechi', 'M', 'J', 'Principal Driver', '2025-06-07 15:21:17', NULL, NULL),
(10, 1, '2008038112', 'Miss Kipsat, Judith Cherotich', 'F', 'K', 'Senior Office Administrative Assistant', '2025-06-07 15:21:17', NULL, NULL),
(11, 1, '2010036582', 'Mr Mwambu, Casper Nalwelisie', 'M', 'J', 'Supply Chain Management Assistant[2]', '2025-06-07 15:21:17', NULL, NULL),
(12, 1, '19870002627', 'Mrs Wasike, Gladys Namukuru', 'F', 'C', 'Support Staff[1]', '2025-06-07 15:21:17', NULL, NULL),
(13, 1, '20130008427', 'Mr Kitur, Edward Kipyego', 'M', '8', 'Member - County Public Service Board', '2025-06-07 15:21:17', NULL, NULL),
(14, 1, '20140047552', 'Mr Wanjala, Johnstone Khakame', 'M', 'Q', 'Deputy Director HRM & Development', '2025-06-07 15:21:17', NULL, NULL),
(15, 1, '20140049798', 'Mr Bwonya, Ezekiel', 'M', 'M', 'Chief  ICT Officer', '2025-06-07 15:21:17', NULL, NULL),
(16, 1, '20150024865', 'Miss Nanjira, Jane', 'F', 'L', '*Senior Records Management Officer', '2025-06-07 15:21:17', NULL, NULL),
(17, 1, '20150043520', 'Mr Wanyonyi, Albert Soita', 'M', 'R', 'Chief Finance Officer', '2025-06-07 15:21:17', NULL, NULL),
(18, 1, '20190028285', 'Miss Wekesa, Lynn Nafula', 'F', 'G', 'Office Administrative Assistant [3]', '2025-06-07 15:21:17', NULL, NULL),
(19, 1, '20190029513', 'Mr Ndiema, David Chesebe', 'M', 'A', 'Support Staff[3]', '2025-06-07 15:21:17', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_jgs`
--

CREATE TABLE `tbl_jgs` (
  `id` int(11) NOT NULL,
  `dept_id` int(11) NOT NULL,
  `name` varchar(4) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_jgs`
--

INSERT INTO `tbl_jgs` (`id`, `dept_id`, `name`, `created_at`) VALUES
(1, 1, 'A', '2025-02-16 17:17:18'),
(2, 1, 'B', '2025-02-16 17:17:18'),
(3, 1, 'D', '2025-02-16 17:17:41'),
(4, 1, 'F', '2025-02-16 17:27:45'),
(5, 1, 'H', '2025-02-18 03:44:14'),
(6, 1, 'P', '2025-02-18 11:47:00'),
(7, 1, 'Q', '2025-02-18 11:47:00'),
(8, 1, 'J', '2025-02-18 11:47:30'),
(9, 1, 'I', '2025-02-18 11:48:33'),
(10, 1, '19', '2025-02-18 12:53:12'),
(11, 1, '34', '2025-02-18 12:59:01'),
(12, 1, '12', '2025-02-18 13:06:33'),
(13, 1, 'K', '2025-05-25 05:12:33'),
(14, 1, 'L', '2025-05-25 05:12:33'),
(15, 1, 'M', '2025-05-25 05:12:33'),
(16, 1, 'N', '2025-05-25 05:12:33'),
(17, 1, 'R', '2025-05-25 06:00:13'),
(18, 1, 'S', '2025-05-25 06:00:26'),
(19, 1, 'T', '2025-05-25 06:01:22'),
(20, 1, '1', '2025-06-07 15:34:23'),
(21, 1, '2', '2025-06-07 15:34:23'),
(22, 1, '3', '2025-06-07 15:34:23'),
(23, 1, '4', '2025-06-07 15:34:23'),
(24, 1, '5', '2025-06-07 15:34:23'),
(25, 1, '6', '2025-06-07 15:34:23'),
(26, 1, '7', '2025-06-07 15:34:23'),
(27, 1, '8', '2025-06-07 15:34:23'),
(28, 1, '9', '2025-06-07 15:34:23');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_logins`
--

CREATE TABLE `tbl_logins` (
  `id` int(11) NOT NULL,
  `role_id` int(1) NOT NULL DEFAULT 5,
  `country_id` int(11) NOT NULL,
  `county_id` int(11) NOT NULL,
  `dept_id` int(11) NOT NULL,
  `email` varchar(70) NOT NULL,
  `username` varchar(8) NOT NULL,
  `password` varchar(150) NOT NULL,
  `hash` varchar(150) NOT NULL,
  `avatar` varchar(150) NOT NULL,
  `created_at` date NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_logins`
--

INSERT INTO `tbl_logins` (`id`, `role_id`, `country_id`, `county_id`, `dept_id`, `email`, `username`, `password`, `hash`, `avatar`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 3, 1, 1, 1, 'mossesjuma@yahoo.com', 'pharlex', '$2y$10$WMVmPdx1pZ5P8I/hck9VjueDh/pdnfRsAiiRwbxS4t9INC2vkGJg6', '3cef96dcc9b8035d23f69e30bb19218a', '1739845052_9be1fa6de63dbe753008.jpg', '2024-12-06', '2025-05-24 11:23:08', NULL),
(2, 4, 1, 1, 1, 'mosesjumawafula@gmail.com', 'pharlexj', '$2y$10$RASOqHhCwt0vfSxrCpnYEuwqbT/6vGQ9NwV54Xj4/6Rz2akdAb4c2', '872488f88d1b2db54d55bc8bba2fad1b', '', '2024-12-06', '2025-02-18 12:58:50', NULL),
(3, 3, 1, 1, 1, 'j@gmail.com', 'lubisia', '$2y$10$Uc70GVgZbujSmXPsJQxiU.mp7XSih9y49tSa3gE8uWcKhGbziZ7By', 'f5deaeeae1538fb6c45901d524ee2f98', '', '2025-02-12', '2025-02-12 03:49:28', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_master_imprest_register`
--

CREATE TABLE `tbl_master_imprest_register` (
  `id` int(11) NOT NULL,
  `transaction_id` int(11) NOT NULL,
  `status` varchar(50) NOT NULL,
  `receipt_payment` varchar(15) NOT NULL,
  `mode` varchar(10) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_messages`
--

CREATE TABLE `tbl_messages` (
  `id` int(11) NOT NULL,
  `from_id` int(11) NOT NULL,
  `to_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `status` varchar(15) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_messages`
--

INSERT INTO `tbl_messages` (`id`, `from_id`, `to_id`, `message`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 2, 'Hi pharlexj, is there funds for travel', 'ok', '2024-12-12 15:09:44', '2024-12-12 15:09:44', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_packages`
--

CREATE TABLE `tbl_packages` (
  `id` int(11) NOT NULL,
  `package_name` varchar(50) NOT NULL,
  `package_description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `duration_days` int(11) NOT NULL,
  `create_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_payments`
--

CREATE TABLE `tbl_payments` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `package_id` int(11) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_status` varchar(50) NOT NULL DEFAULT 'pending',
  `payment_method` varchar(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_permissions`
--

CREATE TABLE `tbl_permissions` (
  `id` int(11) NOT NULL,
  `role_id` int(11) DEFAULT NULL,
  `permission_name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_places`
--

CREATE TABLE `tbl_places` (
  `id` int(11) NOT NULL,
  `country_id` int(11) NOT NULL,
  `place` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_places`
--

INSERT INTO `tbl_places` (`id`, `country_id`, `place`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 'County Headquarters', '2025-02-18 13:04:23', '0000-00-00 00:00:00', '0000-00-00 00:00:00'),
(2, 1, 'Other Town', '2025-02-18 13:06:25', '0000-00-00 00:00:00', '0000-00-00 00:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_reply`
--

CREATE TABLE `tbl_reply` (
  `id` int(11) NOT NULL,
  `msg_id` int(11) NOT NULL,
  `reply_id` int(11) NOT NULL,
  `reply` varchar(255) NOT NULL,
  `reaction` int(1) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_reply`
--

INSERT INTO `tbl_reply` (`id`, `msg_id`, `reply_id`, `reply`, `reaction`, `created_at`, `deleted_at`, `updated_at`) VALUES
(1, 1, 2, 'yes, the counties are dipensing funds to votes then we will be able to process', 0, '2024-12-12 15:09:44', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_roles`
--

CREATE TABLE `tbl_roles` (
  `id` int(11) NOT NULL,
  `role_name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_roles`
--

INSERT INTO `tbl_roles` (`id`, `role_name`) VALUES
(1, 'supper admin'),
(2, 'admin'),
(3, 'aie'),
(4, 'accountant'),
(5, 'user'),
(6, 'auditor');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_transactions`
--

CREATE TABLE `tbl_transactions` (
  `id` int(11) NOT NULL,
  `fy` varchar(10) NOT NULL,
  `aie_id` int(11) NOT NULL,
  `dept_id` int(11) NOT NULL,
  `vote_id` varchar(20) NOT NULL,
  `transaction_type` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  `personal_no` varchar(15) NOT NULL,
  `particulars` text NOT NULL,
  `amounts` decimal(10,2) NOT NULL,
  `subsistence` decimal(10,2) NOT NULL,
  `bus_fare` decimal(10,2) NOT NULL,
  `taxi_fare` decimal(10,2) NOT NULL,
  `amounts_allocated` decimal(11,2) NOT NULL,
  `amouts_commited` decimal(11,2) NOT NULL,
  `balance_before_committed` decimal(11,2) NOT NULL,
  `balance_after_committed` decimal(11,2) NOT NULL,
  `check_no` varchar(20) NOT NULL,
  `voucher_no` varchar(20) NOT NULL,
  `dated` varchar(10) NOT NULL,
  `file` varchar(100) NOT NULL,
  `state` varchar(10) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_transactions`
--

INSERT INTO `tbl_transactions` (`id`, `fy`, `aie_id`, `dept_id`, `vote_id`, `transaction_type`, `name`, `personal_no`, `particulars`, `amounts`, `subsistence`, `bus_fare`, `taxi_fare`, `amounts_allocated`, `amouts_commited`, `balance_before_committed`, `balance_after_committed`, `check_no`, `voucher_no`, `dated`, `file`, `state`, `created_at`, `updated_at`, `deleted_at`) VALUES
(20, '2024/2025', 1, 1, '1000000', 'claim', 'Mr Wamoto, Peter Maloba', '1979022930', 'Team Building', 71900.00, 70000.00, 900.00, 1000.00, 1000000.00, 7000.00, 1000000.00, 928100.00, '032', '0001', '2025-06-10', 'claim_2025521435734.docx', 'pending', '2025-06-10 08:35:15', '2025-06-10 11:35:15', NULL),
(21, '2024/2025', 1, 1, '1000000', 'claim', 'Mr Warui, Samuel Njoroge', '1980081620', 'Team Building', 71900.00, 70000.00, 900.00, 0.00, 1000000.00, 78900.00, 921100.00, 849200.00, '032', '0002', '2025-06-10', 'claim_2025521435579.docx', 'pending', '2025-06-10 08:35:16', '2025-06-10 11:35:16', NULL),
(22, '2024/2025', 1, 1, '1000000', 'claim', 'Mrs Khaoya, Elymaryta Agatha', '1982023181', 'Team Building', 71900.00, 70000.00, 900.00, 0.00, 1000000.00, 150800.00, 849200.00, 777300.00, '032', '0003', '2025-06-10', 'claim_2025521435353.docx', 'pending', '2025-06-10 08:35:17', '2025-06-10 11:35:17', NULL),
(23, '2024/2025', 1, 1, '1000000', 'claim', 'Mrs Chebet, Judith Ruttoh', '2010113122', 'Team Building', 46700.00, 44800.00, 900.00, 0.00, 1000000.00, 222700.00, 777300.00, 730600.00, '032', '0004', '2025-06-10', 'claim_202552143589.docx', 'pending', '2025-06-10 08:35:18', '2025-06-10 11:35:18', NULL),
(24, '2024/2025', 1, 1, '1000000', 'claim', 'Mr Wafula, Moses Juma', '20140051181', 'Team Building', 27100.00, 25200.00, 900.00, 0.00, 1000000.00, 269400.00, 730600.00, 703500.00, '032', '0005', '2025-06-10', 'claim_2025521435834.docx', 'pending', '2025-06-10 08:35:19', '2025-06-10 11:35:19', NULL),
(25, '2024/2025', 1, 1, '1000000', 'claim', 'Miss Wanyama, Daisy Nafula', '20180006946', 'Team Building', 46700.00, 44800.00, 900.00, 0.00, 1000000.00, 296500.00, 703500.00, 656800.00, '032', '0006', '2025-06-10', 'claim_2025521435592.docx', 'pending', '2025-06-10 08:35:19', '2025-06-10 11:35:19', NULL),
(26, '2024/2025', 1, 1, '1000000', 'claim', 'Mrs Musonye, Nancy Nasiali', '20180007103', 'Team Building', 46700.00, 44800.00, 900.00, 0.00, 1000000.00, 343200.00, 656800.00, 610100.00, '032', '0007', '2025-06-10', 'claim_2025521435349.docx', 'pending', '2025-06-10 08:35:20', '2025-06-10 11:35:20', NULL),
(27, '2024/2025', 1, 1, '1000000', 'claim', 'Mrs Omai, Loice Imbogo', '2007006683', 'Team Building', 46700.00, 44800.00, 900.00, 0.00, 1000000.00, 389900.00, 610100.00, 563400.00, '032', '0008', '2025-06-10', 'claim_2025521435120.docx', 'pending', '2025-06-10 08:35:21', '2025-06-10 11:35:21', NULL),
(28, '2024/2025', 1, 1, '1000000', 'claim', 'Mr Osanya, Joseph Frechi', '2007134038', 'Team Building', 27100.00, 25200.00, 900.00, 0.00, 1000000.00, 436600.00, 563400.00, 536300.00, '032', '0009', '2025-06-10', 'claim_2025521435828.docx', 'pending', '2025-06-10 08:35:21', '2025-06-10 11:35:21', NULL),
(29, '2024/2025', 1, 1, '1000000', 'claim', 'Miss Kipsat, Judith Cherotich', '2008038112', 'Team Building', 46700.00, 44800.00, 900.00, 0.00, 1000000.00, 463700.00, 536300.00, 489600.00, '032', '0010', '2025-06-10', 'claim_2025521435612.docx', 'pending', '2025-06-10 08:35:22', '2025-06-10 11:35:22', NULL),
(30, '2024/2025', 1, 1, '1000000', 'claim', 'Mr Mwambu, Casper Nalwelisie', '2010036582', 'Team Building', 27100.00, 25200.00, 900.00, 0.00, 1000000.00, 510400.00, 489600.00, 462500.00, '032', '0011', '2025-06-10', 'claim_2025521435343.docx', 'pending', '2025-06-10 08:35:23', '2025-06-10 11:35:23', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_users`
--

CREATE TABLE `tbl_users` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `role_id` int(11) DEFAULT NULL,
  `package_id` int(11) DEFAULT NULL,
  `dept_id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `create_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_vote`
--

CREATE TABLE `tbl_vote` (
  `id` int(11) NOT NULL,
  `dept_id` int(11) NOT NULL,
  `VoteID` varchar(50) NOT NULL,
  `voted_items` varchar(255) NOT NULL,
  `vote_type` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_vote`
--

INSERT INTO `tbl_vote` (`id`, `dept_id`, `VoteID`, `voted_items`, `vote_type`) VALUES
(1, 1, '1000000', 'Trial Vote', 'Development'),
(2, 1, '2210100', 'Utilities', 'Recurrent'),
(3, 1, '2210101', 'Electricity Expenses', 'Recurrent'),
(4, 1, '2210102', 'Water  and Sewerage', 'Recurrent'),
(5, 1, '2210200', 'Communication Supplies and Services', 'Recurrent'),
(6, 1, '2210201', 'Telephone, Telex, Facsimile and Mobile Services', 'Recurrent'),
(7, 1, '2210202', 'Internet Connections', 'Recurrent'),
(8, 1, '2210203', 'Courier and Postal Services', 'Recurrent'),
(9, 1, '2210300', 'Domestic Travel and Subsistence, and Other Transportation Costs', 'Recurrent'),
(10, 1, '2210301', 'Travel Costs (Airlines, Bus, Railway etc.)', 'Recurrent'),
(11, 1, '2210302', 'Accommodation - Domestic Travel', 'Recurrent'),
(12, 1, '2210303', 'Daily subsistence Allowance', 'Recurrent'),
(13, 1, '2210400', 'Foreign Travel and Subsistence, and Other Transportation Costs', 'Recurrent'),
(14, 1, '2210401', 'Travel Costs (Airlines, Bus, Railway etc.)', 'Recurrent'),
(15, 1, '2210500', 'Printing, Advertising and Information Supplies and Services', 'Recurrent'),
(16, 1, '2210502', 'Publishing & Printing Services', 'Recurrent'),
(17, 1, '2210503', 'Subscription to Newspapers', 'Recurrent'),
(18, 1, '2210504', 'Advertisement (Print Media, Radio etc.)', 'Recurrent'),
(19, 1, '2210700', 'Training Expenses', 'Recurrent'),
(20, 1, '2210711', 'Tuition Fees', 'Recurrent'),
(21, 1, '2210712', 'Training, Mentorship and Capacity Building', 'Recurrent'),
(22, 1, '2210800', 'Hospitality Supplies and services', 'Recurrent'),
(23, 1, '2210801', 'Catering Services, Receptions', 'Recurrent'),
(24, 1, '2211000', 'Specialized Materials & Supplies', 'Recurrent'),
(25, 1, '2211016', 'Purchase of Uniforms and Clothing Staff', 'Recurrent'),
(26, 1, '2211100', 'Office and General Supplies and Services', 'Recurrent'),
(27, 1, '2211101', 'General office Supplies', 'Recurrent'),
(28, 1, '2211103', 'Sanitary Supplies and Services', 'Recurrent'),
(29, 1, '2211200', 'Fuel Oil and Lubricants', 'Recurrent'),
(30, 1, '2211201', 'Refined Fuel and Lubricants', 'Recurrent'),
(31, 1, '2211300', 'Other Operating Expenses', 'Recurrent'),
(32, 1, '2211301', 'Bank Service Commission and Charges (Bank Charges)', 'Recurrent'),
(33, 1, '2211306', 'Membership Fees, Dues and Subscription to Professional and Trade Bodies', 'Recurrent'),
(34, 1, '2220100', 'Routine Maintenance - Vehicles', 'Recurrent'),
(35, 1, '2220101', 'Maintenance Expenses - Motor Vehicles', 'Recurrent'),
(36, 1, '2220200', 'Routine Maintenance - Other Assets', 'Recurrent'),
(37, 1, '2220202', 'Maintenance of Office Furniture and Equipment', 'Recurrent'),
(38, 1, '2220205', 'Maintenance of Buildings', 'Recurrent'),
(39, 1, '2220210', 'Maintenance of Computers, Softwares & Networks', 'Recurrent'),
(40, 1, '3110299', 'Office Construction & Accommodation', 'Development'),
(41, 1, '3110799', 'Utility Vehicle', 'Development'),
(42, 1, '3111000', 'Purchase of Office Furniture and General Equipment', 'Recurrent'),
(43, 1, '3111001', 'Purchase of Office Furniture & Fittings', 'Recurrent'),
(44, 1, '3111002', 'Purchase of Computers, Printers & IT Equipment', 'Recurrent'),
(45, 1, '3111004', 'Communication Supplies', 'Recurrent'),
(46, 1, '3111005', 'Purchase of Photocopiers', 'Recurrent'),
(47, 1, '3111111', 'Online Job Application System', 'Development'),
(48, 1, 'C', 'Contra', 'Recurrent'),
(49, 1, 'CR', 'Creditors', 'Recurrent');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_vote_accounts`
--

CREATE TABLE `tbl_vote_accounts` (
  `id` int(11) NOT NULL,
  `dept_id` int(11) NOT NULL,
  `account` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_vote_accounts`
--

INSERT INTO `tbl_vote_accounts` (`id`, `dept_id`, `account`) VALUES
(1, 1, 'r-n099'),
(2, 1, 'R-F909');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_vote_p`
--

CREATE TABLE `tbl_vote_p` (
  `id` int(11) NOT NULL,
  `VoteID` int(11) NOT NULL,
  `dept_id` int(11) NOT NULL,
  `voted_items` varchar(90) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_vote_p`
--

INSERT INTO `tbl_vote_p` (`id`, `VoteID`, `dept_id`, `voted_items`) VALUES
(6, 1000000, 1, 'Trial Vote'),
(7, 2210100, 1, 'Utilities'),
(8, 2210200, 1, 'Communication Supplies and Services'),
(9, 2210300, 1, 'Domestic Travel and Subsistence, and Other Transportation Costs'),
(10, 2210400, 1, 'Foreign Travel and Subsistence, and Other Transportation Costs'),
(11, 2210500, 1, 'Printing, Advertising and Information Supplies and Services'),
(12, 2210700, 1, 'Training Expenses'),
(13, 2210800, 1, 'Hospitality Supplies and services'),
(14, 2211000, 1, 'Specialized Materials & Supplies'),
(15, 2211100, 1, 'Office and General Supplies and Services'),
(16, 2211200, 1, 'Fuel Oil and Lubricants'),
(17, 2211300, 1, 'Other Operating Expenses'),
(18, 2220100, 1, 'Routine Maintenance - Vehicles'),
(19, 2220200, 1, 'Routine Maintenance - Other Assets'),
(20, 3111000, 1, 'Purchase of Office Furniture and General Equipment'),
(21, 0, 1, ''),
(22, 0, 1, ''),
(23, 0, 1, ''),
(24, 0, 1, ''),
(25, 0, 1, ''),
(26, 0, 1, ''),
(27, 0, 1, ''),
(28, 0, 1, ''),
(29, 0, 1, ''),
(30, 0, 1, ''),
(31, 0, 1, ''),
(32, 0, 1, ''),
(33, 0, 1, ''),
(34, 0, 1, ''),
(35, 0, 1, ''),
(36, 0, 1, ''),
(37, 0, 1, ''),
(38, 0, 1, ''),
(39, 0, 1, ''),
(40, 0, 1, ''),
(41, 0, 1, ''),
(42, 0, 1, ''),
(43, 0, 1, ''),
(44, 0, 1, ''),
(45, 0, 1, ''),
(46, 0, 1, ''),
(47, 0, 1, ''),
(48, 0, 1, ''),
(49, 0, 1, ''),
(50, 0, 1, ''),
(51, 0, 1, ''),
(52, 0, 1, ''),
(53, 0, 1, ''),
(54, 0, 1, ''),
(55, 0, 1, ''),
(56, 0, 1, ''),
(57, 0, 1, ''),
(58, 0, 1, ''),
(59, 0, 1, '');

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `subscription_type` varchar(100) DEFAULT NULL,
  `payment_method` enum('mpesa','credit_card') DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('pending','completed','failed') DEFAULT 'pending',
  `transaction_id` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `username` varchar(255) DEFAULT NULL,
  `role_id` int(11) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `otp_code` varchar(6) DEFAULT NULL,
  `otp_expires_at` datetime DEFAULT NULL,
  `is_verified` tinyint(4) DEFAULT 0,
  `googleId` varchar(255) DEFAULT NULL,
  `facebookId` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `username`, `role_id`, `password`, `otp_code`, `otp_expires_at`, `is_verified`, `googleId`, `facebookId`, `created_at`, `updated_at`) VALUES
(1, 'mossesjuma@yahoo.com', 'pharlex', 2, '$2y$10$EMlSGnMOofKRS/3Fz5soaelgWN2SKfYxa1Cjk5ZdL35udWyncidm.', NULL, NULL, 1, NULL, NULL, '2025-06-02 09:33:08', '0000-00-00 00:00:00'),
(2, 'mosesjumawafula@gmail.com', 'lubisia', 1, '$2y$10$ChzISbufRAAZSK27bmy3QekGSqgwFvKWBo8NGSJM1usP0YgjVAY/6', NULL, NULL, 1, NULL, NULL, '2025-06-02 06:15:08', '0000-00-00 00:00:00'),
(3, 'cpsbtransnzoia@gmail.com', 'cpsb', 3, '$2y$10$6wqwFV476PNtEQsxBNS.J.P9nfrmACMUlOScOA4llbbYrr6LYaB3K', NULL, NULL, 1, NULL, NULL, '2025-06-02 06:14:25', '0000-00-00 00:00:00');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `tbl_allowances`
--
ALTER TABLE `tbl_allowances`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_audits`
--
ALTER TABLE `tbl_audits`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_budget_estimate`
--
ALTER TABLE `tbl_budget_estimate`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_country`
--
ALTER TABLE `tbl_country`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_county`
--
ALTER TABLE `tbl_county`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_dept`
--
ALTER TABLE `tbl_dept`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_employees`
--
ALTER TABLE `tbl_employees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_no` (`personal_no`);

--
-- Indexes for table `tbl_jgs`
--
ALTER TABLE `tbl_jgs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_logins`
--
ALTER TABLE `tbl_logins`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_master_imprest_register`
--
ALTER TABLE `tbl_master_imprest_register`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_messages`
--
ALTER TABLE `tbl_messages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_packages`
--
ALTER TABLE `tbl_packages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_payments`
--
ALTER TABLE `tbl_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `package_id` (`package_id`);

--
-- Indexes for table `tbl_permissions`
--
ALTER TABLE `tbl_permissions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_places`
--
ALTER TABLE `tbl_places`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_reply`
--
ALTER TABLE `tbl_reply`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_roles`
--
ALTER TABLE `tbl_roles`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_transactions`
--
ALTER TABLE `tbl_transactions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_users`
--
ALTER TABLE `tbl_users`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_vote`
--
ALTER TABLE `tbl_vote`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_vote_accounts`
--
ALTER TABLE `tbl_vote_accounts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_vote_p`
--
ALTER TABLE `tbl_vote_p`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `email_2` (`email`),
  ADD UNIQUE KEY `email_3` (`email`),
  ADD UNIQUE KEY `email_4` (`email`),
  ADD UNIQUE KEY `email_5` (`email`),
  ADD UNIQUE KEY `email_6` (`email`),
  ADD UNIQUE KEY `email_7` (`email`),
  ADD UNIQUE KEY `email_8` (`email`),
  ADD UNIQUE KEY `email_9` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `tbl_allowances`
--
ALTER TABLE `tbl_allowances`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `tbl_audits`
--
ALTER TABLE `tbl_audits`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT for table `tbl_budget_estimate`
--
ALTER TABLE `tbl_budget_estimate`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `tbl_country`
--
ALTER TABLE `tbl_country`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tbl_county`
--
ALTER TABLE `tbl_county`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `tbl_dept`
--
ALTER TABLE `tbl_dept`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `tbl_employees`
--
ALTER TABLE `tbl_employees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `tbl_jgs`
--
ALTER TABLE `tbl_jgs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `tbl_logins`
--
ALTER TABLE `tbl_logins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tbl_master_imprest_register`
--
ALTER TABLE `tbl_master_imprest_register`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_messages`
--
ALTER TABLE `tbl_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tbl_packages`
--
ALTER TABLE `tbl_packages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_payments`
--
ALTER TABLE `tbl_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_permissions`
--
ALTER TABLE `tbl_permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_places`
--
ALTER TABLE `tbl_places`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `tbl_reply`
--
ALTER TABLE `tbl_reply`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tbl_roles`
--
ALTER TABLE `tbl_roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `tbl_transactions`
--
ALTER TABLE `tbl_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `tbl_users`
--
ALTER TABLE `tbl_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_vote`
--
ALTER TABLE `tbl_vote`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- AUTO_INCREMENT for table `tbl_vote_accounts`
--
ALTER TABLE `tbl_vote_accounts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `tbl_vote_p`
--
ALTER TABLE `tbl_vote_p`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=60;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
