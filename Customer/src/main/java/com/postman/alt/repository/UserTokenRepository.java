package com.postman.alt.repository;

import com.postman.alt.entity.UserToken;
import com.postman.alt.enums.TokenPurpose;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserTokenRepository extends JpaRepository<UserToken, UUID> {

    Optional<UserToken> findByToken(String token);

    List<UserToken> findByUserIdAndPurpose(UUID userId, TokenPurpose purpose);
}
