import { Controller, Post, Body, HttpStatus, HttpCode, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';
import { BuildService } from '../services/build.service';
import { BuildDto } from '../dto/build.dto';
import { getBuildsReqDto } from '../dto/build.req.dto';

@Controller('build')
export class BuildController {
    constructor(private readonly buildService: BuildService) {}

    @ApiOperation({ summary: '构建结果列表' })
    @ApiQuery({ name: 'projectId', required: true })
    @HttpCode(HttpStatus.OK)
    @Get('getBuilds')
    async getBuilds(@Query() query: getBuildsReqDto) {
        return await this.buildService.findAll(query?.projectId);
    }

    @ApiOperation({ summary: '创建构建结果信息' })
    @HttpCode(HttpStatus.OK)
    @Post('createBuild')
    async createBuild(@Body() buildDto: BuildDto) {
        return await this.buildService.create(buildDto);
    }
}
