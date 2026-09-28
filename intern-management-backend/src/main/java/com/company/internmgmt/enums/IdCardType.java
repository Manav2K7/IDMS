package com.company.internmgmt.enums;

/**
 * Card type drives both the Intern ID prefix (TDA vs EMP) and the daily
 * sequence bucket — stored as a string in the DB so new types can be added
 * without altering the column type.
 */
public enum IdCardType {
    FREE,
    PREMIUM
}
