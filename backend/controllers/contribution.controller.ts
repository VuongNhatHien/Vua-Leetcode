import { Request as RequestExpress } from "express";
import {
  Controller,
  Get,
  Path,
  Post,
  Route,
  SuccessResponse,
  Request,
  Tags,
  Middlewares,
  UploadedFile,
  FormField,
  Put,
} from "tsoa";
import { verifyToken } from "../middlewares/verify-token";
import {
  SubmissionWithResults,
  SuccessResponseInterface,
} from "../interfaces/interface";

import prisma from "../prisma/client";
import { Problem } from "@prisma/client";
import {
  findAllPendingContributions,
  findPendingContribution,
  findSubmissionsContribution,
} from "../services/contribution.services/contribution.services";
import { uploadFile } from "../utils/uploadFileUtils";
import { addResultsToSubmissions } from "../services/problem.services/problem.service";

@Route("/api/contributions") // Base path for contribution-related routes
@Tags("Contributions") // Group this endpoint under "Contributions" in Swagger
export class ContributionController extends Controller {
  @SuccessResponse("201", "Contribute submitted successfully")
  @Post("")
  @Middlewares(verifyToken) // Middleware to verify the user's token
  public async submitContribute(
    @Request() req: RequestExpress, // Request object for user ID and file
    @FormField() title: string, // Request body for contribution details
    @FormField() description: string,
    @FormField() difficulty: string,
    @FormField() tags: string,
    @FormField() timeLimit: string,
    @FormField() memoryLimit: string,
    @UploadedFile()
    file: Express.Multer.File,
  ): Promise<SuccessResponseInterface<{ contribution: Problem }>> {
    const url = await uploadFile("testcases", file);
    const createFile = await prisma.files.create({
      data: {
        filename: file.originalname,
        url: url,
        filesize: file.size,
        fileType: file.mimetype,
      },
    });

    const contribution = await prisma.problem.create({
      data: {
        title: title,
        description: description,
        difficulty: parseInt(difficulty, 10),
        tags: tags,
        timeLimit: parseInt(timeLimit, 10),
        memoryLimit: parseInt(memoryLimit, 10),
        authorId: req.userId, // Accessing the user's ID from the request
        fileId: createFile.fileId,
      },
    });

    return {
      data: { contribution: contribution },
    };
  }

  @Get("/")
  @SuccessResponse("200", "All contributions fetched successfully")
  public async getAllContribute(): Promise<
    SuccessResponseInterface<{ contributions: Problem[] }>
  > {
    // Fetch all pending contributions
    const contributions = await findAllPendingContributions();

    // Return a success response with the fetched contributions
    return {
      data: { contributions: contributions },
    };
  }

  @Get("/{problem_id}/submissions")
  @Middlewares(verifyToken)
  @SuccessResponse(200, "Successfully fetched submissions from problem")
  public async getSubmissionsFromContribution(
    @Path() problem_id: number,
    @Request() req: RequestExpress,
  ): Promise<
    SuccessResponseInterface<{ submissions: SubmissionWithResults[] }>
  > {
    const userId = req.userId;
    const submissions = await findSubmissionsContribution(problem_id, userId);
    const submissionsWithResults = await addResultsToSubmissions(submissions);
    return {
      data: { submissions: submissionsWithResults },
    };
  }

  @Get("{contribute_id}")
  @SuccessResponse("200", "Contribute fetched successfully")
  public async getOneContribute(
    @Path() contribute_id: number, // Contribution ID as a path parameter
  ): Promise<SuccessResponseInterface<{ contribution: Problem }>> {
    const contribution = await findPendingContribution(contribute_id);

    // Return a success response with the fetched contribution
    return {
      data: { contribution: contribution },
    };
  }

  @Put("{contribute_id}/accept")
  @SuccessResponse("200", "Contribution accepted successfully")
  public async acceptContribution(
    @Path() contribute_id: number,
  ): Promise<SuccessResponseInterface<{ contribution: Problem }>> {
    // Validate that the contribution exists and is pending
    await findPendingContribution(contribute_id);

    // Update the contribution status to 'accepted' (e.g., status = 2)
    const updateContribution = await prisma.problem.update({
      where: {
        problemId: contribute_id,
      },
      data: {
        status: 2,
      },
    });

    // Return success response
    return {
      data: { contribution: updateContribution },
    };
  }

  @Put("{contribute_id}/reject")
  @SuccessResponse("200", "Contribution rejected successfully")
  public async rejectContribution(
    @Path() contribute_id: number,
  ): Promise<SuccessResponseInterface<{ contribution: Problem }>> {
    // Validate that the contribution exists and is pending
    await findPendingContribution(contribute_id);

    // Update the contribution status to 'rejected' (e.g., status = 1)
    const updateContribution = await prisma.problem.update({
      where: {
        problemId: contribute_id,
      },
      data: {
        status: 1,
      },
    });

    // Return success response
    return {
      data: { contribution: updateContribution },
    };
  }
}