/**
 * 任务的查询和更新
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskDto } from '../dto/task.dto';
import { Task } from '../entities/task.entity';
import { Performance } from '@/modules/performance/entities/performance.entity';
import { TaskReqDto } from '../dto/task.req.dto';
import { getWhere } from '@/utils';
const fs = require('fs');

@Injectable()
export class TaskService {
    constructor(
        @InjectRepository(Task)
        private readonly taskRepository: Repository<Task>,
        @InjectRepository(Performance)
        private readonly performanceRepository: Repository<Performance>
    ) {}

    async findAll(query: TaskReqDto): Promise<object> {
        try {
            const {
                pageSize = 20,
                current = 1,
                isDefault,
                versionId,
                triggerType = [],
                isUseful = [],
                status = [],
                startTime = '',
                endTime = '',
            } = query;
            const whereParams = { isDelete: 0 };
            let whereSql = 'isDelete = :isDelete ';

            if (isDefault !== 'true') {
                whereSql += 'and versionId= :versionId ';
                Object.assign(whereParams, { versionId });
            }
            if (triggerType?.length) {
                whereSql += 'and triggerType IN (:...triggerType) ';
                Object.assign(whereParams, { triggerType });
            }
            if (isUseful?.length) {
                whereSql += 'and isUseful IN (:...isUseful) ';
                Object.assign(whereParams, { isUseful });
            }
            if (status?.length) {
                whereSql += 'and status IN (:...status) ';
                Object.assign(whereParams, { status });
            }
            if (startTime && endTime) {
                whereSql += 'and createAt between :startTime and :endTime ';
                Object.assign(whereParams, { startTime, endTime });
            }

            const [data, total] = await this.taskRepository
                .createQueryBuilder()
                .where(whereSql, whereParams)
                .skip((current - 1) * pageSize)
                .take(pageSize)
                .orderBy({ taskId: 'DESC' })
                .printSql()
                .getManyAndCount();

            return {
                data,
                total,
                current: +current,
                pageSize: +pageSize,
            };
        } catch (error) {
            console.error('getTasks error', error);
        }
    }

    async findOne(taskId: number): Promise<Task> {
        const result = await this.taskRepository.findOneBy(getWhere({ taskId }));
        return result;
    }

    async update(taskId: number, taskDto: TaskDto) {
        const result = await this.taskRepository.update(taskId, taskDto);
        return result;
    }

    // 批量操作 - 删除
    async batchTask(taskIds: number[]) {
        const result = await this.taskRepository
            .createQueryBuilder()
            .update(Task)
            .set({ isDelete: 1 })
            .where('taskId IN (:...taskIds) and status != :status', { taskIds, status: 1 })
            .execute();

        // 删除文件 CAN_DELETE_FILE 值为 yes 时允许删除，本地运行运行删除
        if (process.env.CAN_DELETE_FILE === 'yes' || process.env.NODE_ENV !== 'production') {
            const whereParams = { isDelete: 1, taskIds };
            const whereSql = `isDelete = :isDelete and taskId IN (:...taskIds)`;
            const [data] = await this.taskRepository
                .createQueryBuilder()
                .where(whereSql, whereParams)
                .printSql()
                .getManyAndCount();
            data?.filter((task) => !!task?.reportPath)?.forEach((task) => {
                const filePath = `./static/${task?.reportPath?.replace('/report/', '')}`;
                try {
                    fs.unlinkSync(filePath);
                } catch (_error) {
                    console.log(`taskId: ${task.taskId}, 检测报告文件删除失败，${filePath}`);
                }
            });
        }

        // 批量删除任务时，把关联的性能数据也删除
        await this.performanceRepository
            .createQueryBuilder()
            .update(Performance)
            .set({ isDelete: 1 })
            .where('taskId IN (:...taskIds) ', { taskIds })
            .execute();

        return result;
    }
}
