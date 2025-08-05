import { Router } from "express";
import { Wrapper } from "../../utils/base.utils";
import { MonitorController } from "./monitorV1.controller";
const monitorV1Router = Router();

/**
 * @swagger
 * /monitor/v1/register:
 *   post:
 *     summary: Register a new site for monitoring
 *     description: Registers a new site for monitoring. If the URL is already registered, it returns an error.
 *     tags: [Monitor V1]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterSiteMonitorDto'
 *     responses:
 *       200:
 *         description: Monitoring routes registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Monitoring routes registered successfully
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: This URL is already registered for monitoring, please edit the existing site instead of creating a new one
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Internal server error
 */
monitorV1Router.post("/register", Wrapper(MonitorController.registerSiteMonitor.bind(MonitorController)));

/**
 * @swagger
 * /monitor/v1/registered-routes:
 *   get:
 *     summary: Get registered monitoring routes
 *     description: Retrieves all registered monitoring routes for a specific site or API with filtering and pagination.
 *     tags: [Monitor V1]
 *     parameters:
 *       - in: query
 *         name: siteId
 *         schema:
 *           type: string
 *         description: ID of the registered site
 *       - in: query
 *         name: siteApiId
 *         schema:
 *           type: string
 *         required: false
 *         description: ID of the specific API within the site
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         required: false
 *         description: Search term to filter APIs by path, URL, or site name
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           enum: [createdAt, url]
 *           default: createdAt
 *         required: false
 *         description: Field to order results by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         required: false
 *         description: Order direction
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         required: false
 *         description: Number of results per page (1–20)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 0
 *         required: false
 *         description: Page number for pagination, starts from 0
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *           default: true
 *         required: false
 *         description: Filter by active status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: integer
 *           enum: [1, 2, 3, 4]
 *         required: false
 *         description: Filter by API priority
 *     responses:
 *       200:
 *         description: Monitoring routes fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Monitoring routes fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     sites:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         page:
 *                           type: number
 *                         limit:
 *                           type: number
 *                         totalPages:
 *                           type: number
 */
monitorV1Router.get("/registered-routes", Wrapper(MonitorController.getRoutes.bind(MonitorController)));

/**
 * @swagger
 * /monitor/v1/registered-routes:
 *   put:
 *     summary: Update registered monitoring routes
 *     description: Updates the details of a registered monitoring route.
 *     tags: [Monitor V1]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSiteMonitorDto'
 *     responses:
 *       200:
 *         description: Monitoring route updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Monitoring route updated successfully
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Invalid input data
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Internal server error
 */
monitorV1Router.put("/registered-routes", Wrapper(MonitorController.updateRoutes.bind(MonitorController)));

/**
 * @swagger
 * /monitor/v1/monitoring-history:
 *   get:
 *     summary: Get monitoring history for a specific API
 *     description: Retrieves monitoring history records for a site API, with optional filters and pagination.
 *     tags: [Monitor V1]
 *     parameters:
 *       - in: query
 *         name: siteId
 *         description: ID of the registered site
 *         schema:
 *           type: string
 *           example: 60c72b2f9b1e8c001c8e4d3a
 *       - in: query
 *         name: siteApiId
 *         description: ID of the specific API within the site
 *         schema:
 *           type: string
 *           example: 60c72b2f9b1e8c001c8e4d3b
 *       - in: query
 *         name: monitoringHistoryId
 *         required: false
 *         description: ID of a specific monitoring history record
 *         schema:
 *           type: string
 *           example: 60c72b2f9b1e8c001c8e4d3c
 *       - in: query
 *         name: status
 *         required: false
 *         description: Filter by status (UP or DOWN)
 *         schema:
 *           type: string
 *           enum: [UP, DOWN]
 *           example: UP
 *       - in: query
 *         name: startDate
 *         required: false
 *         description: Start date for filtering history records (ISO 8601 format)
 *         schema:
 *           type: string
 *           format: date-time
 *           example: 2023-01-01T00:00:00Z
 *       - in: query
 *         name: endDate
 *         required: false
 *         description: End date for filtering history records (ISO 8601 format)
 *         schema:
 *           type: string
 *           format: date-time
 *           example: 2023-01-31T23:59:59Z
 *       - in: query
 *         name: httpMethod
 *         required: false
 *         description: HTTP method used for the API
 *         schema:
 *           type: string
 *           enum: [GET, POST, PUT, DELETE, PATCH]
 *           example: GET
 *       - in: query
 *         name: page
 *         required: false
 *         description: Page number for pagination (starts from 0)
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *           example: 3
 *       - in: query
 *         name: limit
 *         required: false
 *         description: Number of results per page (1–100)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 10
 *           example: 10
 *       - in: query
 *         name: order
 *         required: false
 *         description: Sort direction
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *           example: DESC
 *       - in: query
 *         name: orderBy
 *         required: false
 *         description: Field to sort by
 *         schema:
 *           type: string
 *           enum: [checkedAt, responseTime]
 *           default: checkedAt
 *           example: checkedAt
 *     responses:
 *       200:
 *         description: Monitoring history fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Monitoring history fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     history:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: 64b1c5e6b9ab4f001f2a1e91
 *                           status:
 *                             type: string
 *                             enum: [UP, DOWN]
 *                             example: UP
 *                           responseTime:
 *                             type: number
 *                             example: 213
 *                           checkedAt:
 *                             type: string
 *                             format: date-time
 *                             example: 2023-07-01T12:00:00Z
 *                           wasNotificationSent:
 *                             type: boolean
 *                             example: false
 *                           siteApi:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               path:
 *                                 type: string
 *                                 example: /health
 *                               httpMethod:
 *                                 type: string
 *                                 example: GET
 *                           site:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               url:
 *                                 type: string
 *                                 example: https://example.com
 *                     pagination:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 */
monitorV1Router.get("/monitoring-history", Wrapper(MonitorController.getMonitoringHistory.bind(MonitorController)));

/**
 * @swagger
 * /monitor/v1/monitoring-overview:
 *   get:
 *     summary: Get one-month monitoring overview
 *     description: Retrieves daily monitoring statistics (up, down, response time) for a given site API during a specific month.
 *     tags: [Monitor V1]
 *     parameters:
 *       - in: query
 *         name: siteId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the registered site
 *         example: "60c72b2f9b1e8c001c8e4d3a"
 *       - in: query
 *         name: siteApiId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the specific API within the site
 *         example: "60c72b2f9b1e8c001c8e4d3b"
 *       - in: query
 *         name: yearAndMonth
 *         schema:
 *           type: string
 *         required: true
 *         description: Month to retrieve data for, in YYYY-MM format
 *         example: "2023-01"
 *       - in: query
 *         name: httpMethod
 *         schema:
 *           type: string
 *           enum: [GET, POST, PUT, DELETE, PATCH]
 *         required: false
 *         description: HTTP method used for the API
 *         example: "GET"
 *     responses:
 *       200:
 *         description: One month overview fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: One month overview fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                       properties:
 *                         averageResponseTime:
 *                           type: number
 *                           example: 213
 *                         upCount:
 *                           type: number
 *                           example: 25
 *                         downCount:
 *                           type: number
 *                           example: 5
 *                         totalResponseTime:
 *                           type: number
 *                           example: 12000
 *                         calendar:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               date:
 *                                 type: string
 *                                 example: "2023-01-15"
 *                               upChecks:
 *                                 type: number
 *                                 example: 4
 *                               downChecks:
 *                                 type: number
 *                                 example: 1
 *                               totalChecks:
 *                                 type: number
 *                                 example: 5
 *                               averageResponseTime:
 *                                 type: number
 *                                 example: 221
 *                               uptimePercentage:
 *                                 type: number
 *                                 example: 80
 *                     pagination:
 *                       type: number
 *                       nullable: true
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Site ID is required
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
monitorV1Router.get("/monitoring-overview", Wrapper(MonitorController.getOneMonthOverview.bind(MonitorController)));

export { monitorV1Router };
