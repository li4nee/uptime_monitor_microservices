import { Router } from "express";
import { MonitorHistoryController } from "./monitorV1History.controller";
import { Wrapper } from "../../../utils/base.utils";

const monitorV1HistoryRouter = Router();
/**
 * @swagger
 * /monitor/v1/history/:
 *   get:
 *     summary: Get monitoring history for a specific API
 *     description: >
 *       Retrieves monitoring history records with filtering and pagination.
 *       
 *       **Parameter requirements:**
 *       - You **must provide either**:
 *         - Both `siteId` and `siteApiId` (to get a paginated list of history records for that API), **OR**
 *         - `monitoringHistoryId` alone (to get detailed information for a specific monitoring history record).
 *       
 *       The two options return different response shapes:
 *       - When using `siteId` and `siteApiId`, the response contains a paginated list of history entries.
 *       - When using `monitoringHistoryId`, the response contains detailed information about a single history record.
 *       
 *       If parameters are missing or invalid, an error will be returned.
 *     tags: [Monitor V1 History]
 *     security:
 *       - bearerAuth: []
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
monitorV1HistoryRouter.get("/", Wrapper(MonitorHistoryController.getMonitoringHistory.bind(MonitorHistoryController)));

/**
 * @swagger
 * /monitor/v1/history/monthly-overview:
 *   get:
 *     summary: Get one-month monitoring overview
 *     description: Retrieves daily monitoring statistics (up, down, response time) for a given site API during a specific month.
 *     tags: [Monitor V1 History]
 *     security:
 *       - bearerAuth: []
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
monitorV1HistoryRouter.get("/monthly-overview", Wrapper(MonitorHistoryController.getOneMonthOverview.bind(MonitorHistoryController)));

export { monitorV1HistoryRouter };
