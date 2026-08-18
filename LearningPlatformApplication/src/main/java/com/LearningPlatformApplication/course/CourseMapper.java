package com.LearningPlatformApplication.course;

import com.LearningPlatformApplication.course.dto.ChapterDTO;
import com.LearningPlatformApplication.course.dto.CourseResponse;
import com.LearningPlatformApplication.course.dto.LessonDTO;
import com.LearningPlatformApplication.lesson.Lesson;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class CourseMapper {

    public CourseResponse toResponse(Course course) {
        if (course == null) return null;
        return CourseResponse.builder()
                .id(course.getId())
                .title(course.getTitle())
                .description(course.getDescription())
                .instructorId(course.getInstructorId())
                .price(course.getPrice())
                .status(course.getStatus())
                .createdAt(course.getCreatedAt())
                .chapters(course.getChapters() == null ? java.util.Collections.emptyList() :
                        course.getChapters().stream().map(this::toChapterDTO).collect(Collectors.toList()))
                .build();
    }

    public ChapterDTO toChapterDTO(Chapter chapter) {
        if (chapter == null) return null;
        return ChapterDTO.builder()
                .id(chapter.getId())
                .title(chapter.getTitle())
                .sequenceOrder(chapter.getSequenceOrder())
                .lessons(chapter.getLessons() == null ? java.util.Collections.emptyList() :
                        chapter.getLessons().stream().map(this::toLessonDTO).collect(Collectors.toList()))
                .build();
    }

    public LessonDTO toLessonDTO(Lesson lesson) {
        if (lesson == null) return null;
        return LessonDTO.builder()
                .id(lesson.getId())
                .chapterId(lesson.getChapterId())
                .title(lesson.getTitle())
                .description(lesson.getDescription())
                .lessonType(lesson.getLessonType())
                .contentUrl(lesson.getContentUrl())
                .videoThumbnailUrl(lesson.getVideoThumbnailUrl())
                .quizData(lesson.getQuizData())
                .sequenceOrder(lesson.getSequenceOrder())
                .build();
    }
}
